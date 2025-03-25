"use client";
import dynamic from "next/dynamic";
import "leaflet/dist/leaflet.css";
import { useEffect, useState, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { useMapEvents } from "react-leaflet";

// import GpxMap from './components/GpxMap';
import { parseGpxFile } from './utils/parseGPX';
import { uploadToS3 } from './utils/s3Uploader';
import { interpolateColor } from './utils/colorUtils';

import lakePH from "./lakePH.jpg";
import Image from "next/image";

import Footer from "./Footer";



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
const Popup = dynamic(() => import("react-leaflet").then((mod) => mod.Popup), {
  ssr: false,
});
const Circle = dynamic(
  () => import("react-leaflet").then((mod) => mod.Circle),
  { ssr: false }
);
const Polyline = dynamic(
  () => import("react-leaflet").then((mod) => mod.Polyline),
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
  const [currentLocation, setCurrentLocation] = useState<
    [number, number] | null
  >(null);
  const [lakes, setLakes] = useState<Lake[]>([]);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [uploadedFileType, setUploadedFileType] = useState<string | null>(null);
  const [selectedLake, setSelectedLake] = useState<Lake | null>(null);
  // const [isRouteLoading, setIsRouteLoading] = useState(false);

  const gpxWorker = useRef<Worker | null>(null);

  useEffect(() => {
    gpxWorker.current = new Worker(new URL('@/app/workers/gpxWorker.js', import.meta.url));
    return () => gpxWorker.current?.terminate();
  }, []);

  useEffect(() => {
    if (!currentLocation) return;

    const calculateDistance = (
      lat1: number,
      lon1: number,
      lat2: number,
      lon2: number
    ) => {
      const toRad = (value: number) => (value * Math.PI) / 180;
      const R = 3958.8; // Radius of the Earth in miles
      const dLat = toRad(lat2 - lat1);
      const dLon = toRad(lon2 - lon1);
      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) *
          Math.cos(toRad(lat2)) *
          Math.sin(dLon / 2) ** 2;
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c; // Distance in miles
    };

    // Only update lakes if any distance has changed to avoid an infinite loop
    setLakes((prevLakes) => {
      let updated = false;
      const newLakes = prevLakes.map((lake) => {
        const newDistance = `${calculateDistance(
          currentLocation[0],
          currentLocation[1],
          lake.latitude,
          lake.longitude
        ).toFixed(1)} mi`;
        if (lake.distance !== newDistance) {
          updated = true;
          return { ...lake, distance: newDistance };
        }
        return lake;
      });
      return updated ? newLakes : prevLakes;
    });
  }, [currentLocation, lakes]);

  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();
  const [L, setLeaflet] = useState<any>(null);
  const [radius, setRadius] = useState<number>(15);

  const [points, setPoints] = useState([]);
  const [lakeTracks, setLakeTracks] = useState<Record<number, any[]>>({});
  const mapRef = useRef<any>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    for (const file of Array.from(files)) {
      try {
        let fileType = file.type;
        if (!fileType && file.name.endsWith(".gpx")) {
          fileType = "application/gpx+xml";
        }
        const url = await uploadToS3(file);
        console.log("Uploaded to:", url);
        setUploadedUrl(url);
        setUploadedFileType(fileType);
      
        console.log("📤 Sending to API:", {
          url,
          type: fileType,
          lakeId: null,
          name: file.name,
        });

        // POST metadata to your API
        await fetch("/api/media", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            url,
            type: fileType,
            lakeId: null,
            name: file.name,
          }),
        });

        if (file.name.endsWith('.gpx')) {
          const pts = await parseGpxFile(file);
          setPoints(pts);
        }
      } catch (err) {
        console.error("Failed to upload file:", file.name, err);
      }
    }
  };

  useEffect(() => {
    if (!selectedLake || lakeTracks[selectedLake.id]) return;

    fetch(`/api/media?lakeId=${selectedLake.id}&type=application/gpx+xml`)
      .then(res => {
        if (!res.ok) throw new Error(`Failed to fetch media for lake ${selectedLake.id}`);
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          const media = data[0];
          if (media.url) return fetch(media.url);
        }
        throw new Error(`No GPX media found for lake ${selectedLake.id}`);
      })
      .then(res => res.blob())
      .then(blob => {
        const file = new File([blob], 'temp.gpx', { type: 'application/gpx+xml' });
        return parseGpxFile(file);
      })
      .then(pts => {
        setLakeTracks(prev => ({ ...prev, [selectedLake.id]: pts }));
      })
      .catch(err => console.error('Error loading GPX for selected lake', selectedLake.id, err));
  }, [selectedLake, lakeTracks]);

  useEffect(() => {
    // Import Leaflet on the client side
    import("leaflet").then((leaflet) => setLeaflet(leaflet));

    // Helper function for fetching lakes
    const fetchLakes = (lat?: number, lon?: number) => {
      const url =
        lat && lon
          ? `/api/lakes?latitude=${lat}&longitude=${lon}`
          : "/api/lakes";
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
      },
    });
    return (
      <div className="absolute bottom-1 right-1 bg-white/80 p-2 rounded-sm z-1000">
        {`Lat: ${coords.lat.toFixed(4)}, Lng: ${coords.lng.toFixed(4)}`}
      </div>
    );
  }

  return (
    <>


      <div className="flex">
        <div className="h-screen w-full relative">
          {typeof window !== "undefined" && L ? (
            <MapContainer
              ref={mapRef}
              center={currentLocation || [45.0, -93.0]}
              zoom={11}
              className="w-full h-full relative z-10 rounded"
              style={{ opacity: 0.95 }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                // attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />

              <span className="text-black">
                <MouseCoordinates />
              </span>
              {currentLocation && (
                <>
                  {/* Inject the gradient definition into the DOM */}
                  <svg style={{ height: 0, width: 0, position: "absolute" }}>
                    <defs>
                      <radialGradient
                        id="circleGradient"
                        cx="50%"
                        cy="50%"
                        r="50%"
                      >
                        <stop offset="50%" stopColor="blue" stopOpacity={0.5} />
                        <stop
                          offset="100%"
                          stopColor="blue"
                          stopOpacity={0.3}
                        />
                      </radialGradient>
                    </defs>
                  </svg>

                  <Circle
                    center={currentLocation}
                    radius={(radius * 1609.34 * 1) / 2} // half the outer circle's radius
                    pathOptions={{
                      stroke: false,
                      fillColor: "url(#circleGradient)",
                    }}
                  />
                  <Circle
                    center={currentLocation}
                    radius={radius * 1609.34} // convert miles to meters
                    pathOptions={{
                      stroke: false,
                      fillColor: "url(#circleGradient)",
                    }}
                  />
                </>
              )}
              {lakes
                .filter((lake) => typeof lake.longitude === "number")
                .map((lake) => (
                  <Marker
                    key={lake.id}
                    position={[lake.latitude, lake.longitude]}
                    eventHandlers={{
                      mouseover: (e) => e.target.openPopup(),
                      mouseout: (e) => e.target.closePopup(),
                      click: () => {
                        if (mapRef.current) {
                          mapRef.current.setView([lake.latitude, lake.longitude], 14, { animate: true });
                        }
                        setSelectedLake(lake);
                      }
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
                  {points.length > 0 &&
                    points.slice(1).map((point, i) => {
                      const prev = points[i];
                      const speed = point.speed ?? 0;
                      const heading = point.heading;

                      const color = interpolateColor(speed, 0, 5); // adjust range if needed

                      return (
                        <Polyline
                          key={`line-${i}`}
                          positions={[
                            [prev.lat, prev.lon],
                            [point.lat, point.lon],
                          ]}
                          pathOptions={{ color, weight: 4 }}
                        />
                      );
                    })
                  }
                  {Object.entries(lakeTracks).map(([lakeId, pts]) => (
                    // pts && pts.length > 0 && pts.slice(1).map((point, i) => {
                    //   if (i % 2 !== 0) return null; // Show every 10th segment only
                    //   const prev = pts[i];
                    //   return (
                    //     <Polyline
                    //       key={`lake-${lakeId}-line-${i}`}
                    //       positions={[[prev.lat, prev.lon], [point.lat, point.lon]]}
                    //       pathOptions={{ color: 'brown', weight: 4 }}
                    //     />
                    //   );
                    // })
                    pts && pts.length > 0 && (
                      <Polyline
                        key={`lake-${lakeId}`}
                        // positions={pts.filter((_, i) => i % 2 === 0).map(p => [p.lat, p.lon])}
                        positions={pts.map(p => [p.lat, p.lon])}
                        pathOptions={{ color: 'brown', weight: 4 }}
                      />
                    )
                  ))}
                  
                  {/* {points
                    .filter((p, i) => p.heading && i % 15 === 0)
                    .map((p, i) => (
                      <Marker
                        key={`arrow-${i}`}
                        position={[p.lat, p.lon]}
                        icon={L?.divIcon({
                          html: `<div style="transform: rotate(${p.heading}deg); font-size: 16px;">➡️</div>`,
                          iconSize: [20, 20],
                          iconAnchor: [10, 10],
                        })}
                      />
                    ))} */}
                </MapContainer>
                
          ) : (
            <div className="flex justify-center items-center h-[500px]">
              <p className="text-gray-400">Loading map...</p>
            </div>
          )}
          {selectedLake && (
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white/95 p-4 rounded shadow-lg z-[1000] w-80 border border-gray-300 text-black">
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-lg font-semibold">{selectedLake.name}</h2>
                <button
                  onClick={() => setSelectedLake(null)}
                  className="text-gray-500 hover:text-black cursor-pointer"
                >
                  ✕
                </button>
              </div>
              <ul className="">
                <li><strong>Distance:</strong> {selectedLake.distance}</li>
                <li><strong>Latitude:</strong> {selectedLake.latitude}</li>
                <li><strong>Longitude:</strong> {selectedLake.longitude}</li>
              </ul>
              {/* <p></p>
              <p></p>
              <p></p> */}

            </div>
          )}
        </div>
        {/* //????????????????????????//????????????????????????//????????????????????????//???????????????????????? */}
        <div className="p-4 bg-white/3 backdrop-filter backdrop-blur-xs text-black shadow-md z-50 fixed text-xs left-14 top-4 rounded">
        <label htmlFor="mediaUpload" className="block mb-2 font-semibold">Upload Image, Video, or GPX:</label>
        <input
          id="mediaUpload"
          type="file"
          multiple
          accept=".jpg,.jpeg,.png,.mp4,.mov,.gpx"
          onChange={handleFileUpload}
          className="border rounded p-2"
        />
        {uploadedUrl && uploadedFileType && (
          <div className="mt-4">
            <p className="text-sm text-gray-600">Uploaded: {uploadedFileType}</p>
            {uploadedFileType.startsWith('image') ? (
              <div className="relative w-full h-60 mt-2 border">
                <img src={uploadedUrl} alt="Preview" style={{ objectFit: "contain" }} />
              </div>
            ) : uploadedFileType.startsWith('video') ? (
              <video src={uploadedUrl} controls className="w-full max-h-60 mt-2" />
            ) : (
              <p className="mt-2 text-sm italic text-gray-500">File uploaded.</p>
            )}
          </div>
        )}
      </div>
        {/* //????????????????????????//????????????????????????//????????????????????????//???????????????????????? */}


        <div className="bg-white/3 backdrop-filter backdrop-blur-xs text-black text-center flex fixed top-7 right-7 z-50 p-2 rounded-md shadow-xl max-h-[50vh] md:max-h-11/12 overflow-auto">
          {/* Render list of lakes */}
          {loading ? (
            <p className="text-gray-400 text-center">Loading lakes...</p>
          ) : (
            <div className="flex flex-col items-center">
              <div className="sticky top-0 z-50 bg-gray-200 rounded-md p-2 w-full">
                {/* <label htmlFor="radius">Search Radius </label> */}
                <input
                  className="cursor-pointer mx-2 align-middle"
                  id="radius"
                  type="range"
                  min="1"
                  max="50"
                  step="1"
                  value={radius}
                  onChange={(e) => setRadius(Number(e.target.value))}
                />
                <span>{radius} mi</span>
              </div>
              <ul className="p-4 space-y-2">
                {lakes
                  .filter(lake => lake.distance)
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
                        onClick={() => {
                          if (mapRef.current) {
                            mapRef.current.setView([lake.latitude, lake.longitude], 14, { animate: true });
                          }
                          setSelectedLake(lake);
                        }}
                        className=" flex cursor-pointer border border-black/20 p-2 rounded hover:border-blue-800/45 hover:bg-blue-400/10 transition-colors"
                        style={{ opacity: lakeDistance > radius ? 0.5 : 1 }}
                      >
                        <span className="h-20 w-20 bg-amber-400 mr-2">
                          <Image
                            src={lakePH.src}
                            alt="placeholder"
                            className="h-full w-full object-cover"
                            width={20}
                            height={20}
                          />
                        </span>
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

      < Footer />
    </>
  );
}
