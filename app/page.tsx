"use client";

//* LIBRARIES *//
import "leaflet/dist/leaflet.css";
import { useEffect, useState, useRef } from "react";

//* UTILS *//
import { parseGpxFile } from "./utils/parseGPX";
import { uploadToS3 } from "./utils/s3Uploader";
import { calculateDistance } from "./utils/distanceUtils";

//* COMPONENTS *//
import Footer from "./components/Footer";
import LakeSidebar from "./components/LakeSidebar";
import MapContainerWrapper from "./components/MapContainerWrapper";
import LakeDetailsPanel from "./components/LakeDetailsPanel";
import UploadPanel from "./components/UploadPanel";
import Header from "./components/Header";
// import Account from "./components/Account";

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
  const [isRouteLoading, setIsRouteLoading] = useState(false);
  const [lakeVideos, setLakeVideos] = useState<Record<number, string | null>>(
    {}
  );
  const [videoProgress, setVideoProgress] = useState<number>(0);
  const [locationError, setLocationError] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const gpxWorker = useRef<Worker | null>(null);

  useEffect(() => {
    gpxWorker.current = new Worker(
      new URL("@/app/workers/gpxWorker.js", import.meta.url)
    );
    return () => gpxWorker.current?.terminate();
  }, []);

  useEffect(() => {
    if (!currentLocation) return;

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
  const [L, setLeaflet] = useState<typeof import("leaflet") | null>(null);
  const [radius, setRadius] = useState<number>(15);

  interface GpxPoint {
    lat: number;
    lon: number;
    ele: number;
    time: Date;
    speed: number | null;
    heading: number | null;
  }

  const [points, setPoints] = useState<GpxPoint[]>([]);
  const [lakeTracks, setLakeTracks] = useState<Record<number, GpxPoint[]>>({});

  const mapRef = useRef<L.Map | null>(null);
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

        if (file.name.endsWith(".gpx")) {
          const pts = await parseGpxFile(file);
          setPoints(pts);
        }
      } catch (err) {
        console.error("Failed to upload file:", file.name, err);
      }
    }
  };

  useEffect(() => {
    if (!selectedLake) return;

    const lakeId = selectedLake.id;

    if (!lakeTracks[lakeId]) {
      setIsRouteLoading(true);

      fetch(`/api/media?lakeId=${lakeId}&type=application/gpx+xml`)
        .then((res) => {
          if (!res.ok)
            throw new Error(`Failed to fetch media for lake ${lakeId}`);
          return res.json();
        })
        .then((data) => {
          if (Array.isArray(data) && data.length > 0) {
            const media = data[0];
            if (media.url) return fetch(media.url);
          }
          throw new Error(`No GPX media found for lake ${lakeId}`);
        })
        .then((res) => res.blob())
        .then((blob) => {
          const file = new File([blob], "temp.gpx", {
            type: "application/gpx+xml",
          });
          return parseGpxFile(file);
        })
        .then((pts) => {
          setLakeTracks((prev) => ({ ...prev, [lakeId]: pts }));
        })
        .catch((err) =>
          console.error("Error loading GPX for selected lake", lakeId, err)
        )
        .finally(() => {
          setIsRouteLoading(false);
        });
    }

    if (!lakeVideos[lakeId]) {
      fetch(`/api/media?lakeId=${lakeId}&type=video/mp4`)
        .then((res) => {
          if (!res.ok)
            throw new Error(`Failed to fetch video for lake ${lakeId}`);
          return res.json();
        })
        .then((data) => {
          if (Array.isArray(data) && data.length > 0) {
            const media = data[0];
            if (media.url) {
              setLakeVideos((prev) => ({ ...prev, [lakeId]: media.url }));
            }
          }
        })
        .catch((err) =>
          console.error("Error loading video for lake", lakeId, err)
        );
    }
  }, [selectedLake, lakeTracks, lakeVideos]);

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
          setCurrentLocation(null);
          setLocationError(true);
          fetchLakes();
        }
      );
    } else {
      fetchLakes();
    }
  }, []);

  return (
    <>
      {/* <Account /> */}
      <div className="flex">
        <div className="h-screen w-full relative">
          <MapContainerWrapper
            currentLocation={currentLocation}
            lakes={lakes}
            selectedLake={selectedLake}
            setSelectedLake={setSelectedLake}
            L={L}
            points={points}
            lakeTracks={lakeTracks}
            videoProgress={videoProgress}
            mapRef={mapRef}
            radius={radius}
          />
          < Header />
          <LakeDetailsPanel
            selectedLake={selectedLake}
            setSelectedLake={setSelectedLake}
            lakeTracks={lakeTracks}
            points={points}
            lakeVideos={lakeVideos}
            videoRef={videoRef}
            videoProgress={videoProgress}
            setVideoProgress={setVideoProgress}
            isRouteLoading={isRouteLoading}
          />
        </div>

        <UploadPanel
          handleFileUpload={handleFileUpload}
          uploadedUrl={uploadedUrl}
          uploadedFileType={uploadedFileType}
        />

        <LakeSidebar
          lakes={lakes}
          radius={radius}
          setRadiusAction={setRadius}
          selectedLake={selectedLake}
          setSelectedLakeAction={setSelectedLake}
          mapRef={mapRef}
          loading={loading}
          locationError={locationError}
        />
      </div>

      <Footer />

      <style jsx global>{`
        .transparent-icon {
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
        }
        .leaflet-container {
          cursor: grab;
        }
      `}</style>
    </>
  );
}
