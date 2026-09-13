import { useEffect, useRef, useState } from "react";
import type { TrailPoint } from "../lib/types";

export type GeolocationStatus = "idle" | "locating" | "tracking" | "denied" | "error";

interface GeolocationState {
  position: TrailPoint | null;
  status: GeolocationStatus;
  error: string | null;
}

const OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  maximumAge: 2_000,
  timeout: 30_000,
};

function toTrailPoint(p: GeolocationPosition): TrailPoint {
  return {
    lat: p.coords.latitude,
    lng: p.coords.longitude,
    t: p.timestamp,
    accuracy: Number.isFinite(p.coords.accuracy) ? p.coords.accuracy : null,
    altitude: p.coords.altitude,
    speed: p.coords.speed,
    heading: p.coords.heading,
  };
}

/** Continuously watches the device position while `enabled`. */
export function useGeolocation(enabled: boolean): GeolocationState {
  const [state, setState] = useState<GeolocationState>({
    position: null,
    status: "idle",
    error: null,
  });
  const watchRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) return;

    if (!("geolocation" in navigator)) {
      setState({ position: null, status: "error", error: "This browser has no geolocation." });
      return;
    }

    setState((prev) => ({ ...prev, status: prev.position ? "tracking" : "locating", error: null }));

    watchRef.current = navigator.geolocation.watchPosition(
      (p) => setState({ position: toTrailPoint(p), status: "tracking", error: null }),
      (err) => {
        setState((prev) => ({
          position: prev.position,
          status: err.code === err.PERMISSION_DENIED ? "denied" : "error",
          error:
            err.code === err.PERMISSION_DENIED
              ? "Location permission was denied. Enable it for this site, then reload."
              : err.message || "Could not get a location fix.",
        }));
      },
      OPTIONS,
    );

    return () => {
      if (watchRef.current !== null) {
        navigator.geolocation.clearWatch(watchRef.current);
        watchRef.current = null;
      }
    };
  }, [enabled]);

  return state;
}
