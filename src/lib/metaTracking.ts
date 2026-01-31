import { supabase } from "@/integrations/supabase/client";

// Generate unique event ID for deduplication
export const generateEventId = (): string => {
  return `${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
};

// Get Facebook cookies for better matching
const getFbCookies = () => {
  const cookies = document.cookie.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split('=');
    acc[key] = value;
    return acc;
  }, {} as Record<string, string>);

  return {
    fbp: cookies._fbp || undefined,
    fbc: cookies._fbc || undefined,
  };
};

interface UserData {
  email?: string;
  phone?: string;
  first_name?: string;
  last_name?: string;
}

interface CustomData {
  value?: number;
  currency?: string;
  content_name?: string;
  content_category?: string;
  [key: string]: any;
}

// Send event to both Pixel and CAPI
export const trackMetaEvent = async (
  eventName: string,
  userData?: UserData,
  customData?: CustomData
): Promise<void> => {
  const eventId = generateEventId();
  const eventSourceUrl = window.location.href;

  // 1. Fire browser Pixel event with event_id for deduplication
  if ((window as any).fbq) {
    (window as any).fbq('track', eventName, customData || {}, { eventID: eventId });
    console.log(`Meta Pixel fired: ${eventName}`, { eventId });
  }

  // 2. Send to CAPI via Edge Function
  try {
    const fbCookies = getFbCookies();
    
    const { data, error } = await supabase.functions.invoke('meta-capi', {
      body: {
        event_name: eventName,
        event_id: eventId,
        event_source_url: eventSourceUrl,
        user_data: {
          ...userData,
          ...fbCookies,
        },
        custom_data: customData,
      },
    });

    if (error) {
      console.error('Meta CAPI error:', error);
    } else {
      console.log(`Meta CAPI sent: ${eventName}`, data);
    }
  } catch (err) {
    console.error('Meta CAPI request failed:', err);
  }
};

// Convenience functions for common events
export const trackLead = (userData?: UserData) => 
  trackMetaEvent('Lead', userData);

export const trackContact = (userData?: UserData) => 
  trackMetaEvent('Contact', userData);

export const trackPageView = () => 
  trackMetaEvent('PageView');

export const trackSubmitApplication = (userData?: UserData) => 
  trackMetaEvent('SubmitApplication', userData);
