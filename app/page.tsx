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
  const router = useRouter();
  const [L, setLeaflet] = useState<any>(null);

  useEffect(() => {
    import("leaflet").then((leaflet) => {
      setLeaflet(leaflet);
      console.log("Leaflet loaded:", leaflet);
    });

    fetch("/api/lakes")
      .then((res) => res.json())
      .then(setLakes);
  }, []);

  return (
    <div className="h-screen">
      <h1 className="text-2xl font-bold text-center my-4">Nearby Lakes</h1>

      {typeof window !== "undefined" && L && (
        <MapContainer center={[45.0, -93.0]} zoom={10} className="h-1/2">
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          {lakes
            .filter((lake) => 
              typeof lake.latitude === "number" && 
              typeof lake.longitude === "number"
            )
            .map((lake) => (
              <Marker
                key={lake.id}
                position={[lake.latitude, lake.longitude]}
                eventHandlers={{
                  click: () => router.push(`/lake/${lake.id}`)
                }}
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
        </MapContainer>
      )}

      {/* List of Lakes */}
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
    </div>
  );
}