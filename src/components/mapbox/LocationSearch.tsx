import { useState, useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { MAPBOX_PUBLIC_TOKEN } from "@/lib/mapbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, MapPin, Building2, Home, Plane } from "lucide-react";

interface LocationSearchProps {
  value: string;
  onChange: (value: string, lat?: number, lng?: number) => void;
  placeholder?: string;
  label?: string;
}

interface SearchResult {
  id: string;
  place_name: string;
  center: [number, number];
}

interface PresetLocation {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  icon: React.ReactNode;
}

const PRESET_LOCATIONS: PresetLocation[] = [
  {
    id: "office",
    name: "Office",
    address: "TADMAIDS Domestic Workers Services Center, Croesus Building, Majan, Dubai",
    lat: 25.0459,
    lng: 55.1957,
    icon: <Building2 className="w-4 h-4" />,
  },
  {
    id: "accommodation",
    name: "Accommodation",
    address: "Al Wadi, Fire Station Road, Muwaileh Commercial, Sharjah",
    lat: 25.3163,
    lng: 55.4631,
    icon: <Home className="w-4 h-4" />,
  },
  {
    id: "airport-t1",
    name: "Airport T1",
    address: "Dubai International Airport Terminal 1, Dubai",
    lat: 25.2528,
    lng: 55.3644,
    icon: <Plane className="w-4 h-4" />,
  },
];

const LocationSearch = ({ value, onChange, placeholder = "Search location...", label }: LocationSearchProps) => {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [showPresets, setShowPresets] = useState(true);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    mapboxgl.accessToken = MAPBOX_PUBLIC_TOKEN;

    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [55.2708, 25.2048], // Dubai default
      zoom: 10,
    });

    mapRef.current.addControl(new mapboxgl.NavigationControl(), "top-right");

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  // Update marker when location changes
  useEffect(() => {
    if (!mapRef.current || !selectedLocation) return;

    if (markerRef.current) {
      markerRef.current.remove();
    }

    markerRef.current = new mapboxgl.Marker({ color: "#3b82f6" })
      .setLngLat([selectedLocation.lng, selectedLocation.lat])
      .addTo(mapRef.current);

    mapRef.current.flyTo({
      center: [selectedLocation.lng, selectedLocation.lat],
      zoom: 15,
    });
  }, [selectedLocation]);

  const searchLocations = async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setResults([]);
      setShowPresets(true);
      return;
    }

    setShowPresets(false);
    setIsSearching(true);
    try {
      // Search UAE and nearby countries, with proximity bias to Dubai
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchQuery)}.json?access_token=${MAPBOX_PUBLIC_TOKEN}&proximity=55.2708,25.2048&limit=5&types=place,locality,neighborhood,address,poi`
      );
      
      if (!response.ok) {
        throw new Error(`Mapbox API error: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Mapbox search results:", data);
      setResults(data.features || []);
    } catch (error) {
      console.error("Error searching locations:", error);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectLocation = (result: SearchResult) => {
    setQuery(result.place_name);
    setSelectedLocation({ lat: result.center[1], lng: result.center[0] });
    onChange(result.place_name, result.center[1], result.center[0]);
    setResults([]);
    setShowPresets(false);
  };

  const handleSelectPreset = (preset: PresetLocation) => {
    setQuery(preset.name);
    setSelectedLocation({ lat: preset.lat, lng: preset.lng });
    onChange(preset.address, preset.lat, preset.lng);
    setResults([]);
    setShowPresets(false);
  };

  return (
    <div className="space-y-3">
      {label && <label className="text-sm font-medium">{label}</label>}
      
      {/* Preset Location Buttons */}
      <div className="flex flex-wrap gap-2">
        {PRESET_LOCATIONS.map((preset) => (
          <Button
            key={preset.id}
            type="button"
            variant={query === preset.name ? "default" : "outline"}
            size="sm"
            onClick={() => handleSelectPreset(preset)}
            className="gap-1.5"
          >
            {preset.icon}
            {preset.name}
          </Button>
        ))}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            searchLocations(e.target.value);
          }}
          onFocus={() => {
            if (query.length < 3) setShowPresets(true);
          }}
          placeholder={placeholder}
          className="pl-10"
        />
        
        {results.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-background border rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {results.map((result) => (
              <div
                key={result.id}
                className="p-3 hover:bg-accent cursor-pointer border-b last:border-0 flex items-start gap-2"
                onClick={() => handleSelectLocation(result)}
              >
                <MapPin className="w-4 h-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                <span className="text-sm">{result.place_name}</span>
              </div>
            ))}
          </div>
        )}
        
        {isSearching && (
          <div className="absolute right-3 top-3">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Map Preview */}
      <div 
        ref={mapContainerRef} 
        className="w-full h-48 rounded-lg border overflow-hidden"
      />
    </div>
  );
};

export default LocationSearch;
