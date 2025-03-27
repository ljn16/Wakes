"use client";
import { RefObject } from "react";

interface Lake {
  id: number;
  name: string;
  distance: string;
  latitude: number;
  longitude: number;
}

interface GpxPoint {
  lat: number;
  lon: number;
}

interface Props {
  selectedLake: Lake | null;
  setSelectedLake: (lake: Lake | null) => void;
  lakeTracks: Record<number, GpxPoint[]>;
  points: GpxPoint[];
  lakeVideos: Record<number, string | null>;
  videoRef: RefObject<HTMLVideoElement | null>
  videoProgress: number;
  setVideoProgress: (value: number) => void;
  isRouteLoading: boolean;
}

export default function LakeDetailsPanel({
  selectedLake,
  setSelectedLake,
  lakeTracks,
  points,
  lakeVideos,
  videoRef,
//   videoProgress,
  setVideoProgress,
  isRouteLoading,
}: Props) {
  if (!selectedLake) return null;

  const route = lakeTracks[selectedLake.id] || points;

  const getRouteDistance = () => {
    if (!route || route.length < 2) return "N/A";
    const toRad = (value: number) => (value * Math.PI) / 180;
    let distance = 0;
    for (let i = 1; i < route.length; i++) {
      const lat1 = route[i - 1].lat;
      const lon1 = route[i - 1].lon;
      const lat2 = route[i].lat;
      const lon2 = route[i].lon;
      const dLat = toRad(lat2 - lat1);
      const dLon = toRad(lon2 - lon1);
      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      distance += 3958.8 * c; // in miles
    }
    return `${distance.toFixed(2)} mi`;
  };

  const getEstimatedTime = () => {
    const distStr = getRouteDistance();
    const distance = parseFloat(distStr);
    if (isNaN(distance)) return "N/A";
    const hours = distance / 3;
    const wholeHours = Math.floor(hours);
    const minutes = Math.round((hours - wholeHours) * 60);
    return `${wholeHours}h ${minutes}m`;
  };

  return (
    <div className="absolute top-4 left-4 bg-white/3 backdrop-filter backdrop-blur-xs p-2 rounded shadow-lg z-[1000] text-black">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-lg font-semibold">
          {selectedLake.name}&nbsp;&nbsp;
          <span className="font-normal text-sm">{selectedLake.distance}</span>
        </h2>
        <button
          onClick={() => setSelectedLake(null)}
          className="text-gray-500 hover:text-black cursor-pointer"
        >
          ✕
        </button>
      </div>
      <ul>
        {isRouteLoading && (
          <li className="text-blue-500 mt-2 italic">Route loading...</li>
        )}
        <li>Route distance: {getRouteDistance()}</li>
        <li>Estimated Time: {getEstimatedTime()}</li>
        <li className="mt-2">
          <a
            href={`https://fishing-app.gpsnauticalcharts.com/i-boating-fishing-web-app/fishing-marine-charts-navigation.html?title=${encodeURIComponent(
              selectedLake.name + ", LAKE boating app"
            )}#15.22/${selectedLake.latitude}/${selectedLake.longitude}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline flex items-center gap-1"
          >
            View depth map
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-4 h-4"
            >
              <path
                transform="rotate(-90 12 12)"
                d="M5.5 18.5a.75.75 0 000 1.5h12a.75.75 0 00.75-.75v-12a.75.75 0 00-1.5 0v10.19L6.28 6.28a.75.75 0 00-1.06 1.06l10.19 10.19H5.5z"
              />
            </svg>
          </a>
        </li>
      </ul>

      {lakeVideos[selectedLake.id] && (
        <div className="mt-2 bg-black rounded overflow-hidden z-[1100]">
          <video
            ref={videoRef}
            src={lakeVideos[selectedLake.id]!}
            controls
            className="w-full aspect-video max-h-96"
            onTimeUpdate={(e) => {
              const current = e.currentTarget.currentTime;
              const duration = e.currentTarget.duration;
              if (duration > 0) {
                setVideoProgress(current / duration);
              }
            }}
            onError={() =>
              console.error("Error loading video:", lakeVideos[selectedLake.id])
            }
          />
        </div>
      )}
    </div>
  );
}