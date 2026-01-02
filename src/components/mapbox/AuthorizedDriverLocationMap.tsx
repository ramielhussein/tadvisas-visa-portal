import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { MAPBOX_PUBLIC_TOKEN } from "@/lib/mapbox";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Navigation, Lock } from "lucide-react";

// Authorized user emails for driver location viewing
const AUTHORIZED_EMAILS = [
  "joseph@tadmaids.com",
  "rami@tadmaids.com",
  "rayaan@tadmaids.com",
];

interface AuthorizedDriverMapProps {
  transfer: {
    id: string;
    driver_id?: string;
    driver_lat?: number | null;
    driver_lng?: number | null;
    driver_location_updated_at?: string | null;
    created_by?: string;
    driver?: {
      full_name?: string | null;
      email?: string;
    };
    from_lat?: number | null;
    from_lng?: number | null;
    to_lat?: number | null;
    to_lng?: number | null;
  };
}

interface DriverLocation {
  lat: number;
  lng: number;
  timestamp: string;
  taskId?: string;
  driverId?: string;
}

const AuthorizedDriverLocationMap = ({ transfer }: AuthorizedDriverMapProps) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const driverMarkerRef = useRef<mapboxgl.Marker | null>(null);
  
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [driverLocation, setDriverLocation] = useState<DriverLocation | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Check if current user is authorized
  useEffect(() => {
    const checkAuthorization = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsAuthorized(false);
        return;
      }

      setCurrentUserId(user.id);

      // Get user profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("email")
        .eq("id", user.id)
        .single();

      if (!profile) {
        setIsAuthorized(false);
        return;
      }

      // Check if user is authorized:
      // 1. User created the task
      // 2. User email is in authorized list
      const isCreator = transfer.created_by === user.id;
      const isAuthorizedEmail = AUTHORIZED_EMAILS.includes(profile.email?.toLowerCase() || "");

      setIsAuthorized(isCreator || isAuthorizedEmail);
    };

    checkAuthorization();
  }, [transfer.created_by]);

  // Subscribe to real-time driver location via presence
  useEffect(() => {
    if (!isAuthorized || !transfer.driver_id) return;

    let channel: ReturnType<typeof supabase.channel> | null = null;

    const setupRealtimeTracking = async () => {
      console.log("[AuthorizedMap] Setting up for driver:", transfer.driver_id);

      // IMPORTANT: Must use the same channel name as drivers use to publish their location
      channel = supabase.channel("driver-tracking-presence", {
        config: { presence: { key: `viewer-${currentUserId}` } },
      });

      channel
        .on("presence", { event: "sync" }, () => {
          const state = channel?.presenceState() || {};
          
          // Find location for this specific driver
          Object.entries(state).forEach(([key, presences]: [string, any]) => {
            if (key.startsWith("viewer-") || key.startsWith("admin-")) return;

            if (presences?.length > 0) {
              const latest = presences[presences.length - 1];
              if (
                latest.driverId === transfer.driver_id &&
                typeof latest.lat === "number" &&
                typeof latest.lng === "number"
              ) {
                console.log("[AuthorizedMap] Got location:", latest.lat, latest.lng);
                setDriverLocation({
                  lat: latest.lat,
                  lng: latest.lng,
                  timestamp: latest.timestamp,
                  taskId: latest.taskId,
                  driverId: latest.driverId,
                });
              }
            }
          });
        })
        .subscribe(async (status) => {
          console.log("[AuthorizedMap] Channel:", status);
          if (status === "SUBSCRIBED") {
            await channel?.track({ role: "viewer" });
          }
        });
    };

    setupRealtimeTracking();

    // Also set initial location from transfer data
    if (transfer.driver_lat && transfer.driver_lng) {
      setDriverLocation({
        lat: transfer.driver_lat,
        lng: transfer.driver_lng,
        timestamp: transfer.driver_location_updated_at || new Date().toISOString(),
      });
    }

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [isAuthorized, transfer.driver_id, transfer.driver_lat, transfer.driver_lng, currentUserId]);

  // Initialize map
  useEffect(() => {
    if (!isAuthorized || !mapContainerRef.current || mapRef.current) return;

    mapboxgl.accessToken = MAPBOX_PUBLIC_TOKEN;

    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center: [55.2708, 25.2048], // Dubai default
      zoom: 12,
    });

    mapRef.current.addControl(new mapboxgl.NavigationControl(), "top-right");

    return () => {
      if (driverMarkerRef.current) {
        driverMarkerRef.current.remove();
        driverMarkerRef.current = null;
      }
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [isAuthorized]);

  // Update driver marker
  useEffect(() => {
    if (!mapRef.current || !driverLocation) return;

    const driverName = transfer.driver?.full_name || transfer.driver?.email || "Driver";

    if (driverMarkerRef.current) {
      driverMarkerRef.current.setLngLat([driverLocation.lng, driverLocation.lat]);
    } else {
      const el = document.createElement("div");
      el.innerHTML = `
        <div class="relative">
          <div class="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center border-3 border-white shadow-xl animate-pulse">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/>
              <circle cx="7" cy="17" r="2"/>
              <path d="M9 17h6"/>
              <circle cx="17" cy="17" r="2"/>
            </svg>
          </div>
          <div class="absolute -bottom-7 left-1/2 -translate-x-1/2 whitespace-nowrap bg-emerald-600 text-white text-xs px-2 py-1 rounded-full shadow font-medium">
            ${driverName.split(" ")[0]}
          </div>
        </div>
      `;

      driverMarkerRef.current = new mapboxgl.Marker({ element: el })
        .setLngLat([driverLocation.lng, driverLocation.lat])
        .setPopup(
          new mapboxgl.Popup({ offset: 25 }).setHTML(`
            <div class="p-3">
              <p class="font-semibold text-base">${driverName}</p>
              <p class="text-xs text-gray-500 mt-1">Last update: ${new Date(driverLocation.timestamp).toLocaleTimeString()}</p>
              <p class="text-xs text-emerald-600 font-medium mt-1">📍 Live Location</p>
            </div>
          `)
        )
        .addTo(mapRef.current!);
    }

    // Center map on driver
    mapRef.current.flyTo({
      center: [driverLocation.lng, driverLocation.lat],
      zoom: 14,
      duration: 1000,
    });
  }, [driverLocation, transfer.driver]);

  // Loading state
  if (isAuthorized === null) {
    return (
      <Card className="border-zinc-700 bg-zinc-800/50">
        <CardContent className="py-6">
          <div className="h-32 flex items-center justify-center">
            <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Not authorized
  if (!isAuthorized) {
    return (
      <Card className="border-zinc-700 bg-zinc-800/50">
        <CardContent className="py-6">
          <div className="flex items-center gap-3 text-muted-foreground">
            <Lock className="w-5 h-5" />
            <span className="text-sm">Driver location is restricted</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // No driver assigned
  if (!transfer.driver_id) {
    return (
      <Card className="border-zinc-700 bg-zinc-800/50">
        <CardContent className="py-6">
          <div className="flex items-center gap-3 text-muted-foreground">
            <MapPin className="w-5 h-5 opacity-50" />
            <span className="text-sm">No driver assigned yet</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-emerald-800/50 bg-emerald-950/20">
      <CardContent className="pt-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Navigation className="w-4 h-4 text-emerald-500" />
            <span className="text-sm font-medium">Live Driver Location</span>
          </div>
          {driverLocation && (
            <Badge variant="secondary" className="bg-emerald-600/20 text-emerald-400 text-xs">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse mr-1" />
              Live
            </Badge>
          )}
        </div>

        {driverLocation ? (
          <>
            <div ref={mapContainerRef} className="h-48 rounded-lg overflow-hidden" />
            <div className="mt-2 text-xs text-muted-foreground">
              Last update: {new Date(driverLocation.timestamp).toLocaleTimeString()}
            </div>
          </>
        ) : (
          <div className="h-32 flex items-center justify-center bg-zinc-800/50 rounded-lg">
            <div className="text-center text-muted-foreground">
              <MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Waiting for driver location...</p>
              <p className="text-xs">Driver will appear when they start tracking</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AuthorizedDriverLocationMap;
