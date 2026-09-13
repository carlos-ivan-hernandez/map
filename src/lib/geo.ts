import type { TrailPoint } from "./types";

const EARTH_RADIUS_M = 6_371_000;

/** Great-circle distance in metres between two coordinates. */
export function haversine(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const toRad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * toRad;
  const dLng = (b.lng - a.lng) * toRad;
  const lat1 = a.lat * toRad;
  const lat2 = b.lat * toRad;

  const h =
    Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);

  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function trailDistance(points: readonly TrailPoint[]): number {
  let total = 0;
  for (let i = 1; i < points.length; i += 1) {
    total += haversine(points[i - 1], points[i]);
  }
  return total;
}

export function formatDistance(metres: number): string {
  const miles = metres / 1609.344;
  return miles < 10 ? `${miles.toFixed(2)} mi` : `${miles.toFixed(1)} mi`;
}

export function formatSpeed(metresPerSecond: number | null): string {
  if (metresPerSecond === null || !Number.isFinite(metresPerSecond) || metresPerSecond < 0) {
    return "--";
  }
  return `${Math.round(metresPerSecond * 2.236936)} mph`;
}

export function formatDuration(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${minutes}:${pad(seconds)}`;
}
