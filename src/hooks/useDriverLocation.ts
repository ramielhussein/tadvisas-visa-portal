import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

interface DriverLocation {
  lat: number;
  lng: number;
  timestamp: string;
  taskId?: string;
}

export const useDriverLocation = (taskId: string | null) => {
  const [isTracking, setIsTracking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const channelRef = useRef<any>(null);

  const startTracking = useCallback(async () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError("User not authenticated");
      return;
    }

    setIsTracking(true);
    setError(null);

    const driverId = user.id;
    console.log('[DriverTracking] Starting tracking for driver:', driverId);

    // Set up presence channel for real-time location broadcast
    channelRef.current = supabase.channel('driver-locations', {
      config: {
        presence: { key: driverId }
      }
    });

    channelRef.current.subscribe(async (status: string, err?: Error) => {
      console.log('[DriverTracking] Channel status:', status, err);
      if (status === 'SUBSCRIBED') {
        console.log('[DriverTracking] Channel subscribed, sending initial presence');
        // Initial track to register presence
        const trackResult = await channelRef.current.track({ 
          driverId, 
          role: 'driver', 
          taskId: taskId || undefined,
          lat: 0,
          lng: 0,
          timestamp: new Date().toISOString()
        });
        console.log('[DriverTracking] Initial track result:', trackResult);
      }
    });

    // Watch position continuously
    watchIdRef.current = navigator.geolocation.watchPosition(
      async (position) => {
        const locationData: DriverLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          timestamp: new Date().toISOString(),
          taskId: taskId || undefined,
        };

        console.log('[DriverTracking] GPS update:', locationData.lat, locationData.lng);

        // Broadcast via presence with driver ID
        if (channelRef.current) {
          const trackResult = await channelRef.current.track({
            ...locationData,
            driverId,
            role: 'driver'
          });
          console.log('[DriverTracking] Location broadcast result:', trackResult);
        }

        // Also update the task if we have one
        if (taskId) {
          await supabase
            .from('worker_transfers')
            .update({
              driver_lat: locationData.lat,
              driver_lng: locationData.lng,
              driver_location_updated_at: locationData.timestamp,
            })
            .eq('id', taskId);
        }
      },
      (err) => {
        console.error('[DriverTracking] Geolocation error:', err);
        setError(err.message);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000,
      }
    );
  }, [taskId]);

  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    setIsTracking(false);
  }, []);

  useEffect(() => {
    return () => {
      stopTracking();
    };
  }, [stopTracking]);

  return { isTracking, error, startTracking, stopTracking };
};

// Hook to subscribe to all driver locations (for admin view)
export const useDriversLocations = () => {
  const [driversLocations, setDriversLocations] = useState<Record<string, DriverLocation & { driverId: string }>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;
    
    console.log('[AdminTracking] Setting up driver locations channel');
    
    try {
      channel = supabase.channel('driver-locations', {
        config: {
          presence: { key: 'admin-viewer' }
        }
      });

      channel
        .on('presence', { event: 'sync' }, () => {
          const state = channel?.presenceState() || {};
          console.log('[AdminTracking] Presence sync - raw state:', JSON.stringify(state, null, 2));
          const locations: Record<string, DriverLocation & { driverId: string }> = {};
          
          Object.entries(state).forEach(([key, presences]: [string, any]) => {
            // Skip the admin viewer's own presence
            if (key === 'admin-viewer') return;
            
            console.log('[AdminTracking] Processing presence key:', key, 'presences:', presences);
            
            if (presences && presences.length > 0) {
              const latest = presences[presences.length - 1];
              console.log('[AdminTracking] Latest presence for', key, ':', latest);
              
              // Check if this is a driver with valid location data (lat/lng can be 0 initially)
              if (typeof latest.lat === 'number' && typeof latest.lng === 'number' && latest.role === 'driver') {
                // Only add if we have actual coordinates (not 0,0)
                if (latest.lat !== 0 || latest.lng !== 0) {
                  locations[key] = {
                    lat: latest.lat,
                    lng: latest.lng,
                    timestamp: latest.timestamp,
                    taskId: latest.taskId,
                    driverId: latest.driverId || key,
                  };
                  console.log('[AdminTracking] Added driver location:', key, locations[key]);
                }
              }
            }
          });
          
          console.log('[AdminTracking] Final drivers locations:', locations);
          setDriversLocations(locations);
          setError(null);
        })
        .on('presence', { event: 'join' }, ({ key, newPresences }) => {
          console.log('[AdminTracking] Driver joined:', key, newPresences);
        })
        .on('presence', { event: 'leave' }, ({ key }) => {
          console.log('[AdminTracking] Driver left:', key);
          setDriversLocations(prev => {
            const updated = { ...prev };
            delete updated[key];
            return updated;
          });
        })
        .subscribe(async (status, err) => {
          console.log('[AdminTracking] Channel status:', status, err);
          if (status === 'SUBSCRIBED') {
            // Track admin presence to join the channel
            const trackResult = await channel?.track({ role: 'admin' });
            console.log('[AdminTracking] Admin subscribed and tracked:', trackResult);
            setError(null);
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            console.error('[AdminTracking] Channel error:', status, err);
            setError(`Connection error: ${status}`);
          }
        });
    } catch (err) {
      console.error('[AdminTracking] Setup error:', err);
      setError('Failed to connect to driver tracking');
    }

    return () => {
      console.log('[AdminTracking] Cleaning up channel');
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  return { driversLocations, error };
};
