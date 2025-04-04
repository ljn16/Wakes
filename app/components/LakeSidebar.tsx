"use client";
import Image from "next/image";
import { RefObject, useState, useRef, useEffect } from "react";
import lakePH from "../lakePH.jpg";
import { Map as LeafletMap } from "leaflet";

interface Lake {
  id: number;
  name: string;
  distance: string;
  latitude: number;
  longitude: number;
}

interface Props {
  lakes: Lake[];
  radius: number;
  setRadiusAction: (r: number) => void;
  selectedLake: Lake | null;
  setSelectedLakeAction: (lake: Lake) => void;
  mapRef: RefObject<LeafletMap | null>;
  loading: boolean;
  locationError: boolean;
}

export default function LakeSidebar({
  lakes,
  radius,
  setRadiusAction,
  selectedLake,
  setSelectedLakeAction,
  mapRef,
  loading,
  locationError,
}: Props) {
  const [sidebarHeight, setSidebarHeight] = useState(200);
  const startYRef = useRef<number | null>(null);
  const startHeightRef = useRef<number>(200);

  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth >= 768) {
      setSidebarHeight(window.innerHeight * 0.9);
    }
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    startYRef.current = e.touches[0].clientY;
    startHeightRef.current = sidebarHeight;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (startYRef.current !== null) {
      const deltaY = startYRef.current - e.touches[0].clientY;
      const newHeight = Math.min(Math.max(startHeightRef.current + deltaY, 100), window.innerHeight * 0.9);
      setSidebarHeight(newHeight);
    }
  };

  return (
    <div
      className="bg-white/3 backdrop-filter backdrop-blur-xs text-black text-center justify-centerflex fixed bottom-0 left-0 md:left-auto md:bottom-7 md:top-7 right-1 md:right-7 z-50 rounded-md shadow-xl overflow-auto md:w-fit md:min-w-1/5 md:h-3/4"
      style={{ height: `${sidebarHeight}px` }}
    >
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        className="w-full h-4 p-1 cursor touch-none transparent rounded-t-md md:hidden"
      >
        <div className="mx-auto w-12 h-1 bg-gray-500 rounded mt-1"></div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center h-full">
          <svg className="animate-spin h-8 w-8 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-gray-600 mt-4">Loading lakes...</p>
        </div>
      ) : (
        <div className="flex flex-col items-center">
          {locationError && (
            <p className="text-red-600 text-sm mb-2">
              ⚠️ Location not found. Showing all lakes.
            </p>
          )}

          <div className="sticky top-0 z-50 bg-gray-200 rounded-b-md p-2 w-full"> {/* //TODO */}
            <input
              className="cursor-pointer mx-2 align-middle"
              id="radius"
              type="range"
              min="1"
              max="50"
              step="1"
              value={radius}
              onChange={(e) => setRadiusAction(Number(e.target.value))}
            />
            <span>{radius} mi away</span>
          </div>
          
          <ul className="p-4 grid grid-cols-2 gap-2 md:block md:space-y-2">
            {lakes.sort((a, b) => {
              const distanceA = parseFloat(a.distance || "Infinity");
              const distanceB = parseFloat(b.distance || "Infinity");
              return distanceA - distanceB;
            })
              .map((lake) => (
                <li
                  key={lake.id}
                  className={`flex flex-col md:flex-row items-center cursor-pointer border border-black/20 p-2 rounded hover:border-blue-800/45 w-min-fit ${
                    selectedLake?.id === lake.id
                      ? "hover:bg-blue-600/25 bg-blue-600/25"
                      : ""
                  } transition-colors`}

                  onClick={() => {
                    if (mapRef.current) {
                      mapRef.current.setView(
                        [lake.latitude, lake.longitude],
                        14,
                        { animate: true }
                      );
                    }
                    setSelectedLakeAction(lake);
                  }}
                  style={{
                    opacity:
                      parseFloat(lake.distance) > radius ? 0.5 : 1,
                  }}
                >

                  <span className="h-20 w-20 bg-blue-500 mr-2">
                    <Image
                      src={lakePH.src}
                      alt="placeholder"
                      className="h-full w-full object-cover"
                      width={20}
                      height={20}
                    />
                  </span>
                  <div className="flex flex-col items-start w-full">
                    <div className="w-full flex items-start justify-between">
                      <span>{lake.name}</span>&nbsp;
                      <span className="text-black/50">{lake.distance}</span>
                    </div>
                    <div className="flex w-full justify-between text-xs text-gray-600">
                      <span>Route: x</span>
                      <span>Est.</span>
                    </div>

                  </div>

                </li>
              ))}
          </ul>
        </div>
      )}
    </div>
  );
}