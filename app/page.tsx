"use client";
import dynamic from "next/dynamic";
import "leaflet/dist/leaflet.css";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const MapContainer = dynamic(() => import("react-leaflet").then((mod) => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then((mod) => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import("react-leaflet").then((mod) => mod.Marker), { ssr: false });
const Popup = dynamic(() => import("react-leaflet").then((mod) => mod.Popup), { ssr: false });

interface Lake {
  id: number;
  name: string;
  distance: string;
  latitude: number;
  longitude: number;
}

export default function Home() {
  const [lakes, setLakes] = useState<Lake[]>([]);
  const [currentLocation, setCurrentLocation] = useState<[number, number] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();
  const [L, setLeaflet] = useState<any>(null);

  useEffect(() => {
    import("leaflet").then((leaflet) => setLeaflet(leaflet));
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLat = position.coords.latitude;
          const userLon = position.coords.longitude;
          setCurrentLocation([userLat, userLon]);
          // Fetch lakes with the user's location
          fetch(`/api/lakes?latitude=${userLat}&longitude=${userLon}`)
            .then((res) => {
              if (!res.ok) throw new Error("Failed to load lakes");
              return res.json();
            })
            .then((data) => {
              console.log("API Response:", data); // Debugging log
              if (Array.isArray(data) && data.length > 0) {
                setLakes(data);
              } else {
                console.error("No lakes found or invalid data:", data);
              }
            })
            .catch((err) => console.error("Error fetching lakes:", err))
            .finally(() => setLoading(false));
        },
        (error) => {
          console.error("Error getting location:", error);
          // Fallback fetch without location
          fetch("/api/lakes")
            .then((res) => {
              if (!res.ok) throw new Error("Failed to load lakes");
              return res.json();
            })
            .then((data) => {
              if (Array.isArray(data)) {
                setLakes(data);
              } else {
                console.error("Invalid lakes data:", data);
              }
            })
            .catch((err) => console.error("Error fetching lakes:", err))
            .finally(() => setLoading(false));
        }
      );
    } else {
      // If geolocation is not available, fetch without location
      fetch("/api/lakes")
        .then((res) => {
          if (!res.ok) throw new Error("Failed to load lakes");
          return res.json();
        })
        .then((data) => {
          if (Array.isArray(data)) {
            setLakes(data);
          } else {
            console.error("Invalid lakes data:", data);
          }
        })
        .catch((err) => console.error("Error fetching lakes:", err))
        .finally(() => setLoading(false));
    }
  }, []);

  return (
    <div className="flex">

    
    <div className="h-screen w-3/4">
      {typeof window !== "undefined" && L ? (
        <MapContainer center={currentLocation || [45.0, -93.0]} zoom={11} className="w-full h-full relative z-10 rounded">
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          
          {/* Render Lake Markers */}
          {lakes
            .filter((lake) => typeof lake.latitude === "number" && typeof lake.longitude === "number")
            .map((lake) => (
              <Marker
                key={lake.id}
                position={[lake.latitude, lake.longitude]}
                eventHandlers={{ click: () => router.push(`/lake/${lake.id}`) }}
                icon={L.icon({
                  iconUrl: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
                  iconSize: [32, 32]
                })}
              >
                <Popup>
                  <strong>{lake.name}</strong> <br />
                  Distance: {lake.distance}
                </Popup>
              </Marker>
            ))}
          
          {/* Marker for Current Location */}
          {currentLocation && (
            <Marker position={currentLocation} icon={L.icon({ iconUrl: "https://cdn-icons-png.flaticon.com/512/684/684908.png", iconSize: [32, 32] })}>
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


    <div className="w-1/4 h-screen">
      {/* List of Lakes */}
      {loading ? (
        <p className="text-gray-400 text-center">Loading lakes...</p>
      ) : (
        <ul className="p-4">
          {lakes.map((lake) => (
            <li
              key={lake.id}
              onClick={() => router.push(`/lake/${lake.id}`)}
              className="cursor-pointer border border-gray-300 p-2 rounded hover:border-red-400 transition-colors"
            >
              {lake.name} - {lake.distance}
            </li>
          ))}
        </ul>
      )}
    </div>


    </div>
  );
}