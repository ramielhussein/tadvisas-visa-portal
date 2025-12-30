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
        // Get initial position - use lower accuracy for faster first fix
        if (!permissionGrantedRef.current) {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              permissionGrantedRef.current = true;
              setError(null);
              updateLocation(pos, driverId);
            },
            (err) => {
              console.log('[DriverTracking] Initial GPS attempting high accuracy failed, trying low accuracy');
              // Try with lower accuracy if high accuracy fails
              navigator.geolocation.getCurrentPosition(
                (pos) => {
                  permissionGrantedRef.current = true;
                  setError(null);
                  updateLocation(pos, driverId);
                },
                (fallbackErr) => {
                  console.error('[DriverTracking] Initial GPS error:', fallbackErr.message);
                  if (fallbackErr.code === 1) {
                    setError("Location permission denied");
                  }
                  // Don't set error for other cases - watch will handle it
                },
                { enableHighAccuracy: false, timeout: 30000, maximumAge: 60000 }
              );
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 }
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
          console.log('[DriverTracking] Watch error code:', err.code, err.message);
          // Only show error for permission denied - other errors are transient
          if (err.code === 1) {
            setError("Location permission denied. Please enable in settings.");
          }
          // For timeout (code 3) and position unavailable (code 2), 
          // watchPosition will automatically retry - no need to show error
        },
        { 
          enableHighAccuracy: true, 
          timeout: 60000, // 60 second timeout per update
          maximumAge: 60000 // Accept cached position up to 60 seconds old
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
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const setup = async () => {
      if (setupDoneRef.current) return;
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setupDoneRef.current = true;
      console.log('[AdminTracking] Setting up');

      // Also poll the database for driver locations as a fallback
      const pollDriverLocations = async () => {
        const { data, error: dbError } = await supabase
          .from('worker_transfers')
          .select('id, driver_id, driver_lat, driver_lng, driver_location_updated_at')
          .not('driver_id', 'is', null)
          .not('driver_lat', 'is', null)
          .not('driver_lng', 'is', null)
          .in('driver_status', ['accepted', 'pickup', 'in_transit'])
          .order('driver_location_updated_at', { ascending: false });

        if (data && data.length > 0) {
          const now = Date.now();
          const activeLocations: Record<string, DriverLocation & { driverId: string }> = {};
          
          data.forEach((transfer) => {
            if (transfer.driver_id && transfer.driver_lat && transfer.driver_lng && transfer.driver_location_updated_at) {
              const updatedAt = new Date(transfer.driver_location_updated_at).getTime();
              // Only include if updated in the last 5 minutes
              if (now - updatedAt < 5 * 60 * 1000) {
                activeLocations[transfer.driver_id] = {
                  lat: transfer.driver_lat,
                  lng: transfer.driver_lng,
                  timestamp: transfer.driver_location_updated_at,
                  taskId: transfer.id,
                  driverId: transfer.driver_id,
                };
              }
            }
          });

          if (Object.keys(activeLocations).length > 0) {
            console.log('[AdminTracking] DB poll found', Object.keys(activeLocations).length, 'active drivers');
            setDriversLocations(prev => ({
              ...prev,
              ...activeLocations,
            }));
            setError(null);
          }
        }
      };

      // Poll immediately and then every 10 seconds
      pollDriverLocations();
      pollIntervalRef.current = setInterval(pollDriverLocations, 10000);

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
              // Accept any presence with valid coordinates (don't require role field)
              if (typeof latest.lat === 'number' && typeof latest.lng === 'number') {
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
            if (typeof latest.lat === 'number' && typeof latest.lng === 'number') {
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
      
      // Clear polling interval
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      setupDoneRef.current = false;
    };
  }, []);

  return { driversLocations, error };
};
