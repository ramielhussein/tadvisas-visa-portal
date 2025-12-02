import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { MAPBOX_PUBLIC_TOKEN } from "@/lib/mapbox";
import { useDriversLocations } from "@/hooks/useDriverLocation";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Navigation } from "lucide-react";

interface DriverInfo {
  id: string;
  email: string;
  full_name: string | null;
}

const DriverTrackingMap = () => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<Record<string, mapboxgl.Marker>>({});
  const driversLocations = useDriversLocations();
  const [driverProfiles, setDriverProfiles] = useState<Record<string, DriverInfo>>({});

  // Fetch driver profiles
  useEffect(() => {
    const fetchDriverProfiles = async () => {
      const driverIds = Object.keys(driversLocations);
      if (driverIds.length === 0) return;

      const { data } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .in('id', driverIds);

      if (data) {
        const profiles: Record<string, DriverInfo> = {};
        data.forEach((p) => {
          profiles[p.id] = p as DriverInfo;
        });
        setDriverProfiles(profiles);
      }
    };

    fetchDriverProfiles();
  }, [driversLocations]);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    mapboxgl.accessToken = MAPBOX_PUBLIC_TOKEN;

    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center: [55.2708, 25.2048], // Dubai
      zoom: 10,
    });

    mapRef.current.addControl(new mapboxgl.NavigationControl(), "top-right");

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  // Update markers when driver locations change
  useEffect(() => {
    if (!mapRef.current) return;

    // Remove old markers that are no longer active
    Object.keys(markersRef.current).forEach((driverId) => {
      if (!driversLocations[driverId]) {
        markersRef.current[driverId].remove();
        delete markersRef.current[driverId];
      }
    });

    // Add/update markers for active drivers
    Object.entries(driversLocations).forEach(([driverId, location]) => {
      const driverName = driverProfiles[driverId]?.full_name || driverProfiles[driverId]?.email || 'Driver';

      if (markersRef.current[driverId]) {
        // Update existing marker position
        markersRef.current[driverId].setLngLat([location.lng, location.lat]);
      } else {
        // Create new marker
        const el = document.createElement('div');
        el.className = 'driver-marker';
        el.innerHTML = `
          <div class="relative">
            <div class="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center border-2 border-white shadow-lg animate-pulse">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/>
                <circle cx="7" cy="17" r="2"/>
                <path d="M9 17h6"/>
                <circle cx="17" cy="17" r="2"/>
              </svg>
            </div>
            <div class="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap bg-slate-800 text-white text-xs px-2 py-1 rounded shadow">
              ${driverName.split(' ')[0]}
            </div>
          </div>
        `;

        const marker = new mapboxgl.Marker({ element: el })
          .setLngLat([location.lng, location.lat])
          .setPopup(
            new mapboxgl.Popup({ offset: 25 }).setHTML(`
              <div class="p-2">
                <p class="font-semibold">${driverName}</p>
                <p class="text-xs text-gray-500">Last update: ${new Date(location.timestamp).toLocaleTimeString()}</p>
                ${location.taskId ? `<p class="text-xs text-emerald-600">On task</p>` : ''}
              </div>
            `)
          )
          .addTo(mapRef.current!);

        markersRef.current[driverId] = marker;
      }
    });

    // Auto-fit bounds if we have drivers
    const driverCount = Object.keys(driversLocations).length;
    if (driverCount > 0 && mapRef.current) {
      const bounds = new mapboxgl.LngLatBounds();
      Object.values(driversLocations).forEach((loc) => {
        bounds.extend([loc.lng, loc.lat]);
      });
      if (driverCount === 1) {
        const loc = Object.values(driversLocations)[0];
        mapRef.current.flyTo({ center: [loc.lng, loc.lat], zoom: 14 });
      } else {
        mapRef.current.fitBounds(bounds, { padding: 50 });
      }
    }
  }, [driversLocations, driverProfiles]);

  const activeDrivers = Object.entries(driversLocations);

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Navigation className="w-5 h-5 text-emerald-500" />
          Live Driver Tracking
          {activeDrivers.length > 0 && (
            <Badge variant="secondary" className="ml-2">
              {activeDrivers.length} active
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {activeDrivers.length === 0 ? (
          <div className="h-64 flex items-center justify-center bg-muted rounded-lg">
            <div className="text-center text-muted-foreground">
              <MapPin className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No active drivers currently tracking</p>
              <p className="text-sm">Drivers will appear here when they start a task</p>
            </div>
          </div>
        ) : (
          <div ref={mapContainerRef} className="h-80 rounded-lg overflow-hidden" />
        )}

        {/* Active Drivers List */}
        {activeDrivers.length > 0 && (
          <div className="mt-4 space-y-2">
            {activeDrivers.map(([driverId, location]) => (
              <div 
                key={driverId} 
                className="flex items-center justify-between p-2 bg-muted rounded-lg"
              >
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse" />
                  <span className="font-medium">
                    {driverProfiles[driverId]?.full_name || driverProfiles[driverId]?.email || 'Unknown Driver'}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  Updated {new Date(location.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DriverTrackingMap;
