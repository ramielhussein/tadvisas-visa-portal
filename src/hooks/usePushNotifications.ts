import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

// VAPID public key for Web Push
const VAPID_PUBLIC_KEY = 'BFCssdHncTfTJ_E5iMpPEwKJoPN8FypY3dQKEMFZQ4DEv-0IeZ3bbHy2J5s4DS_12i-lAyWWLWi82XEXqAnDyYU';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export const usePushNotifications = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if push notifications are supported
    const checkSupport = async () => {
      console.log('Push: Checking browser support...');
      if ('serviceWorker' in navigator && 'PushManager' in window) {
        console.log('Push: Browser supports push notifications');
        setIsSupported(true);
        setPermission(Notification.permission);
        console.log('Push: Current permission:', Notification.permission);
        await checkSubscription();
      } else {
        console.log('Push: Browser does NOT support push notifications');
      }
      setIsLoading(false);
    };
    checkSupport();
  }, []);

  const checkSubscription = async () => {
    try {
      console.log('Push: Checking existing subscription...');
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      const hasSubscription = !!subscription;
      console.log('Push: Has existing subscription:', hasSubscription);
      setIsSubscribed(hasSubscription);
    } catch (error) {
      console.error('Push: Error checking subscription:', error);
    }
  };

  const subscribe = async () => {
    try {
      console.log('Push: Starting subscription process...');
      
      // Request permission
      console.log('Push: Requesting permission...');
      const permission = await Notification.requestPermission();
      console.log('Push: Permission result:', permission);
      setPermission(permission);
      
      if (permission !== 'granted') {
        console.log('Push: Notification permission denied');
        return false;
      }

      // Register service worker
      console.log('Push: Registering service worker...');
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Push: Service worker registered');
      await navigator.serviceWorker.ready;
      console.log('Push: Service worker ready');

      // Subscribe to push
      console.log('Push: Subscribing to push manager...');
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      });
      console.log('Push: Subscription created:', subscription.endpoint.substring(0, 50) + '...');

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('Push: No user logged in');
        return false;
      }
      console.log('Push: User ID:', user.id);

      // Save subscription to database
      const subscriptionJson = subscription.toJSON();
      console.log('Push: Saving subscription to database...');
      const { error } = await supabase.from('push_subscriptions').upsert({
        user_id: user.id,
        endpoint: subscriptionJson.endpoint!,
        p256dh: subscriptionJson.keys!.p256dh,
        auth: subscriptionJson.keys!.auth
      }, {
        onConflict: 'user_id,endpoint'
      });

      if (error) {
        console.error('Push: Error saving subscription:', error);
        return false;
      }

      setIsSubscribed(true);
      console.log('Push: Subscription saved successfully!');
      return true;
    } catch (error) {
      console.error('Push: Error subscribing:', error);
      return false;
    }
  };

  const unsubscribe = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        await subscription.unsubscribe();
        
        // Remove from database
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase
            .from('push_subscriptions')
            .delete()
            .eq('user_id', user.id)
            .eq('endpoint', subscription.endpoint);
        }
      }
      
      setIsSubscribed(false);
      return true;
    } catch (error) {
      console.error('Error unsubscribing:', error);
      return false;
    }
  };

  return {
    isSupported,
    isSubscribed,
    isLoading,
    permission,
    subscribe,
    unsubscribe
  };
};
