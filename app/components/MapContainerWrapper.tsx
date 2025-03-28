"use client";
import dynamic from "next/dynamic";
import { useState, useMemo } from "react";
import { useMapEvents } from "react-leaflet";
import { interpolateColor } from "../utils/colorUtils";

const MapContainer = dynamic(() => import("react-leaflet").then((mod) => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then((mod) => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import("react-leaflet").then((mod) => mod.Marker), { ssr: false });
const Popup = dynamic(() => import("react-leaflet").then((mod) => mod.Popup), { ssr: false });
const Circle = dynamic(() => import("react-leaflet").then((mod) => mod.Circle), { ssr: false });
const Polyline = dynamic(() => import("react-leaflet").then((mod) => mod.Polyline), { ssr: false });

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
  ele: number;
  time: Date;
  speed: number | null;
  heading: number | null;
}

interface Props {
  currentLocation: [number, number] | null;
  lakes: Lake[];
  selectedLake: Lake | null;
  setSelectedLake: (lake: Lake) => void;
  L: typeof import("leaflet") | null;
  points: GpxPoint[];
  lakeTracks: Record<number, GpxPoint[]>;
  videoProgress: number;
  mapRef: React.RefObject<L.Map | null>;
  radius: number;
}

export default function MapContainerWrapper({
  currentLocation,
  lakes,
  selectedLake,
  setSelectedLake,
  L,
  points,
  lakeTracks,
  videoProgress,
  mapRef,
  radius
}: Props) {
  const lakeIcon = useMemo(() => L?.divIcon({
    html: `<div style="background: #2ecc71; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white;"></div>`,
    className: "",
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  }), [L]);

  const blueIcon = useMemo(() => L?.divIcon({
    html: `<div style="background: #3498db; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white;"></div>`,
    className: "",
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  }), [L]);

  if (typeof window === "undefined" || !L) {
    return <div className="flex justify-center items-center h-[500px]"><p className="text-gray-400">Loading map...</p></div>;
  }

  function MouseCoordinates() {
    const [coords, setCoords] = useState({ lat: 0, lng: 0 });
    useMapEvents({
      mousemove: (e) => {
        setCoords(e.latlng);
      },
    });
    return (
      <div className="hidden md:block absolute bottom-0 right-0 bg-white px-1  z-1000 text-black">
        {`${coords.lat.toFixed(3)}, ${coords.lng.toFixed(3)}`}
      </div>
    );
  }

  return (
    <MapContainer
      ref={mapRef}
      center={currentLocation || [45.0, -93.0]}
      zoom={11}
      className="w-full h-full relative z-10 rounded cursor-grab"
      style={{ opacity: 0.95 }}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <MouseCoordinates />
      {currentLocation && (
        <div>
          <svg style={{ height: 0, width: 0, position: "absolute" }}>
            <defs>
              <radialGradient id="circleGradient" cx="50%" cy="50%" r="50%">
          <stop offset="50%" stopColor="blue" stopOpacity={0.2} />
          <stop offset="100%" stopColor="blue" stopOpacity={0.1} />
              </radialGradient>
            </defs>
          </svg>
          <Circle center={currentLocation} radius={(radius * 1609.34 * 1) / 2} pathOptions={{ stroke: false, fillColor: "url(#circleGradient)" }} />
          <Circle center={currentLocation} radius={radius * 1609.34} pathOptions={{ stroke: false, fillColor: "url(#circleGradient)" }} />
        </div>
      )}

      {lakes.map((lake) => (
        <Marker
          key={lake.id}
          position={[lake.latitude, lake.longitude]}
          eventHandlers={{
            mouseover: (e) => e.target.openPopup(),
            mouseout: (e) => e.target.closePopup(),
            click: () => {
              mapRef.current?.setView([lake.latitude, lake.longitude], 14, { animate: true });
              setSelectedLake(lake);
            },
          }}
          icon={blueIcon!}
        >
          <Popup>
            <strong>{lake.name}</strong>&nbsp;{lake.distance}
          </Popup>
        </Marker>
      ))}

      {currentLocation && lakeIcon && (
        <Marker position={currentLocation} icon={lakeIcon}>
          <Popup>You are here</Popup>
        </Marker>
      )}

      {points.length > 0 &&
        points.slice(1).map((point, i) => {
          const prev = points[i];
          const speed = point.speed ?? 0;
          const color = interpolateColor(speed, 0, 5);
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
        })}

      {Object.entries(lakeTracks).map(([lakeId, pts]) => {
        if (pts.length === 0 || Number(lakeId) !== selectedLake?.id) return null;

        const progressLine = (() => {
          const exactIndex = videoProgress * (pts.length - 1);
          const index = Math.floor(exactIndex);
          const nextIndex = Math.min(index + 1, pts.length - 1);
          const t = exactIndex - index;
          const start = pts[index];
          const end = pts[nextIndex];
          const lat = start.lat + (end.lat - start.lat) * t;
          const lon = start.lon + (end.lon - start.lon) * t;
          const heading = start.heading ?? 0;
          const trail: [number, number][] = pts.slice(Math.max(index - 10, 0), index + 1).map(
            (p) => [p.lat, p.lon] as [number, number]
          );

          return (
            <>
              <Polyline
                positions={trail}
                pathOptions={{ color: 'red', weight: 2, opacity: 0.5 }}
              />
              <Marker
                position={[lat, lon]}
                icon={L?.divIcon({
                  html: `<div style="transform: rotate(${heading}deg); font-size: 16px;">➡️</div>`,
                  className: 'transparent-icon',
                  iconSize: [20, 20],
                  iconAnchor: [10, 10],
                })}
              />
            </>
          );
        })();

        return (
          <Polyline
            key={`lake-${lakeId}`}
            positions={pts.map(p => [p.lat, p.lon])}
            pathOptions={{ color: 'brown', weight: 4 }}
          >
            {progressLine}
          </Polyline>
        );
      })}
    </MapContainer>
  );
}