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
    console.log('Driver starting tracking with ID:', driverId);

    // Set up presence channel for real-time location broadcast
    channelRef.current = supabase.channel('driver-locations', {
      config: {
        presence: { key: driverId }
      }
    });

    channelRef.current.subscribe(async (status: string) => {
      if (status === 'SUBSCRIBED') {
        console.log('Driver location channel subscribed, tracking started');
        // Initial track to register presence
        await channelRef.current.track({ driverId, role: 'driver', taskId: taskId || undefined });
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

        console.log('Driver location update:', locationData);

        // Broadcast via presence with driver ID
        if (channelRef.current) {
          await channelRef.current.track({
            ...locationData,
            driverId,
            role: 'driver'
          });
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
        console.error('Geolocation error:', err);
        setError(err.message);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000, // Update every 5 seconds max
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
    
    try {
      channel = supabase.channel('driver-locations', {
        config: {
          presence: { key: 'admin-viewer' }
        }
      });

      channel
        .on('presence', { event: 'sync' }, () => {
          const state = channel?.presenceState() || {};
          console.log('Presence state sync:', state);
          const locations: Record<string, DriverLocation & { driverId: string }> = {};
          
          Object.entries(state).forEach(([key, presences]: [string, any]) => {
            // Skip the admin viewer's own presence
            if (key === 'admin-viewer') return;
            
            if (presences && presences.length > 0) {
              const latest = presences[presences.length - 1];
              // Check if this is a driver with location data
              if (latest.lat && latest.lng && latest.role === 'driver') {
                locations[key] = {
                  lat: latest.lat,
                  lng: latest.lng,
                  timestamp: latest.timestamp,
                  taskId: latest.taskId,
                  driverId: latest.driverId || key,
                };
              }
            }
          });
          
          console.log('Drivers locations updated:', locations);
          setDriversLocations(locations);
          setError(null);
        })
        .on('presence', { event: 'join' }, ({ key, newPresences }) => {
          console.log('Driver joined:', key, newPresences);
        })
        .on('presence', { event: 'leave' }, ({ key }) => {
          console.log('Driver left:', key);
          setDriversLocations(prev => {
            const updated = { ...prev };
            delete updated[key];
            return updated;
          });
        })
        .subscribe(async (status, err) => {
          if (status === 'SUBSCRIBED') {
            // Track admin presence to join the channel
            await channel?.track({ role: 'admin' });
            console.log('Admin subscribed to driver locations channel');
            setError(null);
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            console.error('Channel subscription error:', status, err);
            setError(`Connection error: ${status}`);
          }
        });
    } catch (err) {
      console.error('Error setting up driver locations channel:', err);
      setError('Failed to connect to driver tracking');
    }

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  return { driversLocations, error };
};
