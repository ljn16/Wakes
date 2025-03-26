'use client';

import {
  MapContainer, TileLayer, Polyline, Marker, Popup
} from 'react-leaflet';
import { LatLngExpression, divIcon, point } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useRef, useState } from 'react';
import { interpolateColor } from '../utils/colorUtils';

type GpxPoint = {
  lat: number;
  lon: number;
  ele?: number;
  time: string;
  speed?: number;
  heading?: number;
};

type Props = {
  points: GpxPoint[];
};

export default function GpxMap({ points }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0); // in seconds

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Setup durations on load
  useEffect(() => {
    if (points.length > 1) {
      const start = new Date(points[0].time).getTime();
      const end = new Date(points[points.length - 1].time).getTime();
      setDuration((end - start) / 1000); // seconds
    }
  }, [points]);

  // Play/Pause logic
  useEffect(() => {
    if (isPlaying && currentIndex < points.length - 1) {
      intervalRef.current = setInterval(() => {
        setCurrentIndex((i) => Math.min(i + 1, points.length - 1));
      }, 100); // update every 100ms (10 FPS)

      return () => clearInterval(intervalRef.current!);
    } else {
      clearInterval(intervalRef.current!);
    }
  }, [isPlaying, currentIndex]);

  function findClosestPointIndex(currentSeconds: number) {
    const start = new Date(points[0].time).getTime();
    const targetTime = start + currentSeconds * 1000;

    let closestIndex = 0;
    let minDiff = Infinity;

    for (let i = 0; i < points.length; i++) {
      const time = new Date(points[i].time).getTime();
      const diff = Math.abs(time - targetTime);
      if (diff < minDiff) {
        minDiff = diff;
        closestIndex = i;
      }
    }

    return closestIndex;
  }

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const sync = () => {
      const index = findClosestPointIndex(video.currentTime);
      setCurrentIndex(index);
    };

    video.addEventListener('timeupdate', sync);
    return () => video.removeEventListener('timeupdate', sync);
  }, [points]);

  if (!points.length) return null;

  const path: LatLngExpression[] = points.map((p) => [p.lat, p.lon]);
  const center: LatLngExpression = [points[0].lat, points[0].lon];
  const progressTime = new Date(points[currentIndex].time).getTime() - new Date(points[0].time).getTime();
  const progressPercent = (progressTime / 1000 / duration) * 100;

  // Draw colored route
  const polylines: React.ReactElement[] = [];
  for (let i = 1; i < points.length; i++) {
    const speed = points[i].speed ?? 0;
    const color = interpolateColor(speed, 0, 5); // adjust speed range if needed
    polylines.push(
      <Polyline
        key={`line-${i}`}
        positions={[
          [points[i - 1].lat, points[i - 1].lon],
          [points[i].lat, points[i].lon],
        ]}
        pathOptions={{ color, weight: 4 }}
      />
    );
  }

  // Direction arrows (optional)
  const arrows = points
    .filter((p, i) => p.heading && i % 15 === 0)
    .map((p, i) => (
      <Marker
        key={`arrow-${i}`}
        position={[p.lat, p.lon]}
        icon={divIcon({
          html: `<div style="transform: rotate(${p.heading}deg); font-size: 16px;">➡️</div>`,
          iconSize: point(20, 20),
          iconAnchor: [10, 10],
        })}
      />
    ));

  // Moving marker
  const currentPoint = points[currentIndex];

  return (
    <div>
      <video
        ref={videoRef}
        width="100%"
        controls
        src="/path-to-your-video.mp4" // Replace with actual path
        style={{ marginBottom: '1rem' }}
      />
      <MapContainer center={center} zoom={15} style={{ height: '600px', width: '100%' }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {polylines}
        {arrows}
        <Marker position={[currentPoint.lat, currentPoint.lon]}>
          <Popup>{new Date(currentPoint.time).toLocaleTimeString()}</Popup>
        </Marker>
      </MapContainer>

      {/* Playback Controls */}
      <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button onClick={() => setIsPlaying((p) => !p)}>
          {isPlaying ? 'Pause' : 'Play'}
        </button>

        <input
          type="range"
          min={0}
          max={points.length - 1}
          value={currentIndex}
          onChange={(e) => setCurrentIndex(Number(e.target.value))}
          style={{ flexGrow: 1 }}
        />

        <span>{Math.floor(progressTime / 1000)}s / {Math.floor(duration)}s</span>
      </div>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '5px',
        marginTop: '1rem',
        width: '200px'
      }}>
        <span style={{ fontSize: '0.8rem' }}>Slow</span>
        <div style={{
          background: 'linear-gradient(to right, blue, red)',
          height: '10px',
          flexGrow: 1,
          borderRadius: '5px'
        }} />
        <span style={{ fontSize: '0.8rem' }}>Fast</span>
      </div>
    </div>
  );
}