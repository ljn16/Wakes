"use client";
import Image from "next/image";
import { RefObject } from "react";
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
  setRadius: (r: number) => void;
  selectedLake: Lake | null;
  setSelectedLake: (lake: Lake) => void;
  mapRef: RefObject<LeafletMap | null>;
  loading: boolean;
  locationError: boolean;
}

export default function LakeSidebar({
  lakes,
  radius,
  setRadius,
  selectedLake,
  setSelectedLake,
  mapRef,
  loading,
  locationError,
}: Props) {
  return (
    <div className="bg-white/3 backdrop-filter backdrop-blur-xs text-black text-center flex fixed top-1 md:top-7 right-1 md:right-7 z-50 p-2 rounded-md shadow-xl max-h-[30vh] md:max-h-11/12 overflow-auto">
      {loading ? (
        <p className="text-gray-600 text-center">Loading lakes...</p>
      ) : (
        <div className="flex flex-col items-center">
          {locationError && (
            <p className="text-red-600 text-sm mb-2">
              ⚠️ Location not found. Showing all lakes.
            </p>
          )}
          <div className="sticky top-0 z-50 bg-gray-200 rounded-md p-2 w-full">
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
              .sort((a, b) => {
                const distanceA = parseFloat(a.distance || "Infinity");
                const distanceB = parseFloat(b.distance || "Infinity");
                return distanceA - distanceB;
              })
              .map((lake) => (
                <li
                  key={lake.id}
                  onClick={() => {
                    if (mapRef.current) {
                      mapRef.current.setView(
                        [lake.latitude, lake.longitude],
                        14,
                        { animate: true }
                      );
                    }
                    setSelectedLake(lake);
                  }}
                  className={`flex cursor-pointer border border-black/20 p-2 rounded hover:border-blue-800/45 ${
                    selectedLake?.id === lake.id
                      ? "hover:bg-blue-600/25 bg-blue-600/25"
                      : ""
                  } transition-colors`}
                  style={{
                    opacity:
                      parseFloat(lake.distance) > radius ? 0.5 : 1,
                  }}
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
              ))}
          </ul>
        </div>
      )}
    </div>
  );
}