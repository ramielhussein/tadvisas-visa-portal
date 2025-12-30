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
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const isStartedRef = useRef(false);
  const permissionGrantedRef = useRef(false);

  const startTracking = useCallback(async () => {
    // Prevent duplicate starts
    if (isStartedRef.current) {
      console.log('[DriverTracking] Already tracking, skipping');
      return;
    }

    if (!navigator.geolocation) {
      setError("Geolocation not supported");
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError("Not authenticated");
      return;
    }

    // Check permission state first (if available)
    if (navigator.permissions) {
      try {
        const permissionStatus = await navigator.permissions.query({ name: 'geolocation' });
        console.log('[DriverTracking] Permission state:', permissionStatus.state);
        
        if (permissionStatus.state === 'denied') {
          setError("Location permission denied. Please enable in settings.");
          return;
        }
        
        permissionGrantedRef.current = permissionStatus.state === 'granted';
      } catch (e) {
        // Some browsers don't support this, continue anyway
        console.log('[DriverTracking] Permission query not supported');
      }
    }

    isStartedRef.current = true;
    setIsTracking(true);
    setError(null);

    const driverId = user.id;
    console.log('[DriverTracking] Starting for:', driverId, 'task:', taskId);

    // Setup presence channel with unique name for drivers
    channelRef.current = supabase.channel('driver-tracking-presence', {
      config: { presence: { key: driverId } }
    });

    channelRef.current.subscribe(async (status) => {
      console.log('[DriverTracking] Channel:', status);
      if (status === 'SUBSCRIBED') {
        // Get initial position only once
        if (!permissionGrantedRef.current) {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              permissionGrantedRef.current = true;
              updateLocation(pos, driverId);
            },
            (err) => {
              console.error('[DriverTracking] Initial GPS error:', err.message);
              setError(err.message);
            },
            { enableHighAccuracy: true, timeout: 20000 }
          );
        }
      }
    });

    // Watch position continuously - only set up once
    if (watchIdRef.current === null) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          permissionGrantedRef.current = true;
          setError(null); // Clear any previous error on success
          updateLocation(pos, driverId);
        },
        (err) => {
          console.error('[DriverTracking] Watch error:', err.code, err.message);
          // Handle specific error codes
          if (err.code === 1) {
            setError("Location permission denied");
          } else if (err.code === 2) {
            setError("Location unavailable - trying again...");
            // Don't stop tracking on position unavailable, it will retry
          } else if (err.code === 3) {
            // Timeout - this is common on mobile, just log it and continue
            console.log('[DriverTracking] GPS timeout - will retry automatically');
            // Don't set error for timeout, the watch will retry
          } else {
            setError(err.message);
          }
        },
        { 
          enableHighAccuracy: true, 
          timeout: 60000, // Increased to 60 seconds for mobile
          maximumAge: 30000 // Cache position for 30 seconds
        }
      );
    }

    async function updateLocation(position: GeolocationPosition, userId: string) {
      const locationData = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        timestamp: new Date().toISOString(),
        taskId: taskId || undefined,
        driverId: userId,
        role: 'driver'
      };

      console.log('[DriverTracking] GPS:', locationData.lat.toFixed(5), locationData.lng.toFixed(5));

      // Broadcast via presence
      if (channelRef.current) {
        try {
          await channelRef.current.track(locationData);
        } catch (e) {
          console.error('[DriverTracking] Presence error:', e);
        }
      }

      // Save to database
      if (taskId) {
        const { error: dbError } = await supabase
          .from('worker_transfers')
          .update({
            driver_lat: locationData.lat,
            driver_lng: locationData.lng,
            driver_location_updated_at: locationData.timestamp,
          })
          .eq('id', taskId);

        if (dbError) {
          console.error('[DriverTracking] DB error:', dbError.message);
        } else {
          console.log('[DriverTracking] DB saved');
          setError(null);
        }
      }
    }
  }, [taskId]);

  const stopTracking = useCallback(() => {
    console.log('[DriverTracking] Stopping');
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
    return () => stopTracking();
  }, [stopTracking]);

  return { isTracking, error, startTracking, stopTracking };
};

// Hook for admin view - subscribes to all driver locations
export const useDriversLocations = () => {
  const [driversLocations, setDriversLocations] = useState<Record<string, DriverLocation & { driverId: string }>>({});
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const setupDoneRef = useRef(false);
  const leaveTimeoutsRef = useRef<Record<string, NodeJS.Timeout>>({});
  const reconnectAttemptRef = useRef(0);

  useEffect(() => {
    const setup = async () => {
      if (setupDoneRef.current) return;
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setupDoneRef.current = true;
      console.log('[AdminTracking] Setting up');

      // Use the same channel name as drivers
      channelRef.current = supabase.channel('driver-tracking-presence', {
        config: { presence: { key: `admin-${user.id}` } }
      });

      channelRef.current
        .on('presence', { event: 'sync' }, () => {
          const state = channelRef.current?.presenceState() || {};
          const locations: Record<string, DriverLocation & { driverId: string }> = {};
          
          console.log('[AdminTracking] Presence sync, keys:', Object.keys(state));
          
          Object.entries(state).forEach(([key, presences]: [string, any]) => {
            // Skip admin keys
            if (key.startsWith('admin-')) return;
            
            // Clear any pending leave timeout for this driver
            if (leaveTimeoutsRef.current[key]) {
              clearTimeout(leaveTimeoutsRef.current[key]);
              delete leaveTimeoutsRef.current[key];
            }
            
            if (presences?.length > 0) {
              const latest = presences[presences.length - 1];
              if (typeof latest.lat === 'number' && typeof latest.lng === 'number' && latest.role === 'driver') {
                locations[key] = {
                  lat: latest.lat,
                  lng: latest.lng,
                  timestamp: latest.timestamp,
                  taskId: latest.taskId,
                  driverId: latest.driverId || key,
                };
                console.log('[AdminTracking] Driver found:', key, latest.lat.toFixed(4), latest.lng.toFixed(4));
              }
            }
          });
          
          // Merge with existing locations (keep drivers that are still active)
          setDriversLocations(prev => {
            const merged = { ...prev };
            // Update with new locations
            Object.entries(locations).forEach(([key, loc]) => {
              merged[key] = loc;
            });
            return merged;
          });
          setError(null);
          reconnectAttemptRef.current = 0;
        })
        .on('presence', { event: 'join' }, ({ key, newPresences }) => {
          console.log('[AdminTracking] Driver joined:', key);
          
          // Clear any pending leave timeout for this driver
          if (leaveTimeoutsRef.current[key]) {
            clearTimeout(leaveTimeoutsRef.current[key]);
            delete leaveTimeoutsRef.current[key];
          }
          
          if (!key.startsWith('admin-') && newPresences?.length > 0) {
            const latest = newPresences[newPresences.length - 1];
            if (typeof latest.lat === 'number' && typeof latest.lng === 'number' && latest.role === 'driver') {
              setDriversLocations(prev => ({
                ...prev,
                [key]: {
                  lat: latest.lat,
                  lng: latest.lng,
                  timestamp: latest.timestamp,
                  taskId: latest.taskId,
                  driverId: latest.driverId || key,
                }
              }));
            }
          }
        })
        .on('presence', { event: 'leave' }, ({ key }) => {
          console.log('[AdminTracking] Driver left:', key);
          if (!key.startsWith('admin-')) {
            // Add a 30-second grace period before removing the driver
            // This handles temporary disconnections
            if (leaveTimeoutsRef.current[key]) {
              clearTimeout(leaveTimeoutsRef.current[key]);
            }
            leaveTimeoutsRef.current[key] = setTimeout(() => {
              console.log('[AdminTracking] Removing driver after grace period:', key);
              setDriversLocations(prev => {
                const updated = { ...prev };
                delete updated[key];
                return updated;
              });
              delete leaveTimeoutsRef.current[key];
            }, 30000); // 30 second grace period
          }
        })
        .subscribe(async (status) => {
          console.log('[AdminTracking] Channel:', status);
          if (status === 'SUBSCRIBED') {
            await channelRef.current?.track({ role: 'admin' });
            reconnectAttemptRef.current = 0;
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            setError('Connection error - reconnecting...');
            setupDoneRef.current = false;
            
            // Auto-reconnect with exponential backoff
            const delay = Math.min(1000 * Math.pow(2, reconnectAttemptRef.current), 30000);
            reconnectAttemptRef.current++;
            console.log('[AdminTracking] Reconnecting in', delay, 'ms');
            
            setTimeout(() => {
              if (channelRef.current) {
                supabase.removeChannel(channelRef.current);
                channelRef.current = null;
              }
              setup();
            }, delay);
          }
        });
    };

    setup();
    
    return () => { 
      // Clear all leave timeouts
      Object.values(leaveTimeoutsRef.current).forEach(clearTimeout);
      leaveTimeoutsRef.current = {};
      
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      setupDoneRef.current = false;
    };
  }, []);

  return { driversLocations, error };
};
