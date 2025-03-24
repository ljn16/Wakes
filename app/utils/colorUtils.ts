// Linearly interpolate between two colors based on a value between 0 and 1
export function interpolateColor(speed: number, min: number, max: number): string {
    const clamped = Math.max(0, Math.min(1, (speed - min) / (max - min)));
    const r = Math.floor(255 * clamped);     // red increases with speed
    const g = 0;
    const b = Math.floor(255 * (1 - clamped)); // blue decreases with speed
    return `rgb(${r},${g},${b})`;
  }