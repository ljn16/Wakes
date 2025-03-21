"use client";
import dynamic from "next/dynamic";
import "leaflet/dist/leaflet.css";
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useMapEvents } from "react-leaflet";

// Dynamically import react-leaflet components with SSR disabled
const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import("react-leaflet").then((mod) => mod.Marker),
  { ssr: false }
);
const Popup = dynamic(
  () => import("react-leaflet").then((mod) => mod.Popup),
  { ssr: false }
);
const Circle = dynamic(
  () => import("react-leaflet").then((mod) => mod.Circle),
  { ssr: false }
);

interface Lake {
  id: number;
  name: string;
  distance: string;
  latitude: number;
  longitude: number;
}

export default function Home() {
  const [currentLocation, setCurrentLocation] =
    useState<[number, number] | null>(null);
  const [lakes, setLakes] = useState<Lake[]>([
    {
      id: 3,
      name: "Lake of the Isles",
      distance: "",
      latitude: 44.955,
      longitude: -93.3096,
    },
    {
      id: 4,
      name: "Medicine Lake",
      distance: "",
      latitude: 45.01,
      longitude: -93.4192,
    },
    {
      id: 5,
      name: "Eagle Lake",
      distance: "",
      latitude: 45.0742,
      longitude: -93.4148,
    },
    {
      id: 6,
      name: "White Bear Lake",
      distance: "",
      latitude: 45.075,
      longitude: -92.987,
    },
    {
      id: 7,
      name: "Lake Phalen",
      distance: "",
      latitude: 44.9884,
      longitude: -93.0545,
    },
    {
      id: 8,
      name: "Cedar Lake",
      distance: "",
      latitude: 44.9601,
      longitude: -93.3205,
    },
    {
      id: 9,
      name: "Brownie Lake",
      distance: "",
      latitude: 44.9676,
      longitude: -93.3243,
    },
    {
      id: 10,
      name: "Bde Maka Ska",
      distance: "",
      latitude: 44.9420,
      longitude: -93.3117,
    },
    {
      id: 11,
      name: "Lake Harriet",
      distance: "",
      latitude: 44.9223,
      longitude: -93.3053,
    },
    {
      id: 12,
      name: "Minnehaha Creek",
      distance: "",
      latitude: 44.9532,
      longitude: -93.4855,
    },
  ]);

  useEffect(() => {
    if (!currentLocation) return;

    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
      const toRad = (value: number) => (value * Math.PI) / 180;
      const R = 3958.8; // Radius of the Earth in miles
      const dLat = toRad(lat2 - lat1);
      const dLon = toRad(lon2 - lon1);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c; // Distance in miles
    };

    setLakes((prevLakes) =>
      prevLakes.map((lake) => ({
        ...lake,
        distance: `${calculateDistance(
          currentLocation[0],
          currentLocation[1],
          lake.latitude,
          lake.longitude
        ).toFixed(1)} mi`,
      }))
    );
  }, [currentLocation]);

  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();
  const [L, setLeaflet] = useState<any>(null);
  const [radius, setRadius] = useState<number>(15);

  useEffect(() => {
    // Import Leaflet on the client side
    import("leaflet").then((leaflet) => setLeaflet(leaflet));

    // Helper function for fetching lakes
    const fetchLakes = (lat?: number, lon?: number) => {
      const url =
        lat && lon ? `/api/lakes?latitude=${lat}&longitude=${lon}` : "/api/lakes";
      fetch(url)
        .then((res) => {
          if (!res.ok) throw new Error("Failed to load lakes");
          return res.json();
        })
        .then((data) => {
          if (Array.isArray(data)) {
            setLakes((prev) => [...prev, ...data]);
          } else {
            console.error("Invalid lakes data:", data);
          }
        })
        .catch((err) => console.error("Error fetching lakes:", err))
        .finally(() => setLoading(false));
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLat = position.coords.latitude;
          const userLon = position.coords.longitude;
          setCurrentLocation([userLat, userLon]);
          fetchLakes(userLat, userLon);
        },
        (error) => {
          console.error("Error getting location:", error);
          fetchLakes();
        }
      );
    } else {
      fetchLakes();
    }
  }, []);

  const lakeIcon = useMemo(() => {
    if (L) {
      return L.divIcon({
        html: `<div style="background: #2ecc71; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white;"></div>`,
        className: "",
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });
    }
    return null;
  }, [L]);

  const blueIcon = useMemo(() => {
    if (L) {
      return L.divIcon({
        html: `<div style="background: #3498db; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white;"></div>`,
        className: "",
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });
    }
    return null;
  }, [L]);

  function MouseCoordinates() {
    const [coords, setCoords] = useState({ lat: 0, lng: 0 });
    useMapEvents({
      mousemove: (e) => {
        setCoords(e.latlng);
      }
    });
    return (
      <div style={{
        position: "absolute",
        bottom: "10px",
        right: "10px",
        background: "rgba(255,255,255,0.8)",
        padding: "5px",
        borderRadius: "5px",
        zIndex: 1000
      }}>
        {`Lat: ${coords.lat.toFixed(4)}, Lng: ${coords.lng.toFixed(4)}`}
      </div>
    );
  }

  return (
    <div className="flex">
      <div className="h-screen w-full relative">
        {typeof window !== "undefined" && L ? (
            <MapContainer
            center={currentLocation || [45.0, -93.0]}
            zoom={11}
            className="w-full h-full relative z-10 rounded"
            style={{ opacity: 0.95 }}
            >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />


            <span className="text-black"><MouseCoordinates /></span>
            {currentLocation && (
              <>
                {/* Inject the gradient definition into the DOM */}
                <svg style={{ height: 0, width: 0, position: "absolute" }}>
                  <defs>
                    <radialGradient id="circleGradient" cx="50%" cy="50%" r="50%">
                      <stop offset="50%" stopColor="blue" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="blue" stopOpacity={0.3} />
                    </radialGradient>
                  </defs>
                </svg>

                {/* <Circle
                  center={currentLocation}
                  radius={(radius * 1609.34) / 3} // half the outer circle's radius
                  pathOptions={{ 
                    stroke: false, 
                    fillColor: 'url(#circleGradient)', 
                  }}
                />
                <Circle
                  center={currentLocation}
                  radius={(radius * 1609.34) * 2/3} // half the outer circle's radius
                  pathOptions={{ 
                    stroke: false, 
                    fillColor: 'url(#circleGradient)', 
                  }}
                /> */}
                <Circle
                  center={currentLocation}
                  radius={(radius * 1609.34) * 1/2} // half the outer circle's radius
                  pathOptions={{ 
                    stroke: false, 
                    fillColor: 'url(#circleGradient)', 
                  }}
                />
                <Circle
                  center={currentLocation}
                  radius={radius * 1609.34} // convert miles to meters
                  pathOptions={{
                    stroke: false,
                    fillColor: "url(#circleGradient)"
                  }}
                />
              </>
            )}
            {lakes
              .filter(
              (lake) =>
                  typeof lake.longitude === "number"
              )
              .map((lake) => (
                <Marker
                  key={lake.id}
                  position={[lake.latitude, lake.longitude]}
                  eventHandlers={{
                  mouseover: (e) => e.target.openPopup(),
                  mouseout: (e) => e.target.closePopup(),
                  click: () => router.push(`/lake/${lake.id}`),
                  }}
                  icon={blueIcon!}
                >
                  <Popup>
                    <strong>{lake.name}</strong>&nbsp;{lake.distance}
                  </Popup>
                </Marker>
              ))}

            {/* Render marker for the user's current location */}
            {currentLocation && lakeIcon && (
              <Marker position={currentLocation} icon={lakeIcon}>
                <Popup>You are here</Popup>
              </Marker>
            )}
          </MapContainer>
        ) : (
          <div className="flex justify-center items-center h-[500px]">
            <p className="text-gray-400">Loading map...</p>
          </div>
        )}
      </div>

      <div className="bg-white/3 backdrop-filter backdrop-blur-xs text-black text-center flex fixed top-7 right-7 z-50 p-2 rounded-md shadow-xl">
        {/* Render list of lakes */}
        {loading ? (
          <p className="text-gray-400 text-center">Loading lakes...</p>
        ) : (
          <div className="flex flex-col items-center">
            <span>
            <label htmlFor="radius">Search Radius </label>
            <input
              id="radius"
              type="range"
              min="1"
              max="50"
              step="1"
              value={radius}
              onChange={(e) => setRadius(Number(e.target.value))}
              style={{ width: "60px", border: "none", outline: "none", cursor: "pointer" }}
            />
            <span>{radius} mi</span>
          </span>
            <ul className="p-4 space-y-2">
              {lakes
                .slice()
                .sort((a, b) => {
                  const distanceA = parseFloat(a.distance.split(" ")[0]);
                  const distanceB = parseFloat(b.distance.split(" ")[0]);
                  return distanceA - distanceB;
                })
                .map((lake) => {
                  const lakeDistance = parseFloat(lake.distance.split(" ")[0]);
                  return (
                    <li
                      key={lake.id}
                      onClick={() => router.push(`/lake/${lake.id}`)}
                      className="cursor-pointer border border-black/20 p-2 rounded hover:border-blue-800/45 hover:bg-blue-400/10 transition-colors"
                      style={{ opacity: lakeDistance > radius ? 0.5 : 1 }}
                    >
                      <span>{lake.name}</span>&nbsp;
                      <span className="text-black/50">{lake.distance}</span>
                    </li>
                  );
                })}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}