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
  const isStartedRef = useRef(false);

  const startTracking = useCallback(async () => {
    // Prevent double-starting
    if (isStartedRef.current) {
      console.log('[DriverTracking] Already tracking, skipping start');
      return;
    }

    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      console.error('[DriverTracking] Geolocation not supported');
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError("User not authenticated");
      console.error('[DriverTracking] User not authenticated');
      return;
    }

    isStartedRef.current = true;
    setIsTracking(true);
    setError(null);

    const driverId = user.id;
    console.log('[DriverTracking] Starting tracking for driver:', driverId, 'taskId:', taskId);

    // Set up presence channel
    channelRef.current = supabase.channel('driver-locations', {
      config: { presence: { key: driverId } }
    });

    channelRef.current.subscribe(async (status: string, err?: Error) => {
      console.log('[DriverTracking] Channel status:', status, err?.message);
      if (status === 'SUBSCRIBED') {
        // Request GPS permission and start watching
        try {
          // Get initial position first
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              const locationData = {
                lat: position.coords.latitude,
                lng: position.coords.longitude,
                timestamp: new Date().toISOString(),
                taskId: taskId || undefined,
                driverId,
                role: 'driver'
              };
              console.log('[DriverTracking] Initial position:', locationData.lat, locationData.lng);
              
              await channelRef.current?.track(locationData);
              
              // Update database
              if (taskId) {
                const { error: dbError } = await supabase
                  .from('worker_transfers')
                  .update({
                    driver_lat: locationData.lat,
                    driver_lng: locationData.lng,
                    driver_location_updated_at: locationData.timestamp,
                  })
                  .eq('id', taskId);
                if (dbError) console.error('[DriverTracking] DB update error:', dbError);
                else console.log('[DriverTracking] DB updated successfully');
              }
            },
            (err) => {
              console.error('[DriverTracking] Initial position error:', err.message);
              setError(`GPS Error: ${err.message}`);
            },
            { enableHighAccuracy: true, timeout: 15000 }
          );
        } catch (e) {
          console.error('[DriverTracking] GPS request error:', e);
        }
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

        console.log('[DriverTracking] GPS update:', locationData.lat.toFixed(5), locationData.lng.toFixed(5));

        // Broadcast via presence
        if (channelRef.current) {
          await channelRef.current.track({
            ...locationData,
            driverId,
            role: 'driver'
          });
        }

        // Update database for the task
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
        console.error('[DriverTracking] Watch error:', err.code, err.message);
        setError(`GPS Error: ${err.message}`);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 3000,
      }
    );
  }, [taskId]);

  const stopTracking = useCallback(() => {
    console.log('[DriverTracking] Stopping tracking');
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    isStartedRef.current = false;
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
        config: { presence: { key: 'admin-viewer' } }
      });

      channel
        .on('presence', { event: 'sync' }, () => {
          const state = channel?.presenceState() || {};
          console.log('[AdminTracking] Presence sync:', Object.keys(state).length, 'entries');
          const locations: Record<string, DriverLocation & { driverId: string }> = {};
          
          Object.entries(state).forEach(([key, presences]: [string, any]) => {
            if (key === 'admin-viewer') return;
            
            if (presences && presences.length > 0) {
              const latest = presences[presences.length - 1];
              
              if (typeof latest.lat === 'number' && typeof latest.lng === 'number' && latest.role === 'driver') {
                if (latest.lat !== 0 || latest.lng !== 0) {
                  locations[key] = {
                    lat: latest.lat,
                    lng: latest.lng,
                    timestamp: latest.timestamp,
                    taskId: latest.taskId,
                    driverId: latest.driverId || key,
                  };
                  console.log('[AdminTracking] Driver:', key, 'at', latest.lat.toFixed(4), latest.lng.toFixed(4));
                }
              }
            }
          });
          
          setDriversLocations(locations);
          setError(null);
        })
        .on('presence', { event: 'join' }, ({ key, newPresences }) => {
          console.log('[AdminTracking] Driver joined:', key);
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
          console.log('[AdminTracking] Channel:', status);
          if (status === 'SUBSCRIBED') {
            await channel?.track({ role: 'admin' });
            setError(null);
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            setError(`Connection error: ${status}`);
          }
        });
    } catch (err) {
      console.error('[AdminTracking] Setup error:', err);
      setError('Failed to connect');
    }

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  return { driversLocations, error };
};
