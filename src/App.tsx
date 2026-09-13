import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Map as LeafletMap } from "leaflet";
import { Spinner } from "@heroui/react";
import { LoginScreen } from "./components/LoginScreen";
import { MapView, MAX_ZOOM, MIN_ZOOM } from "./components/MapView";
import { MapControls } from "./components/MapControls";
import { ControlDock } from "./components/ControlDock";
import { Hud } from "./components/Hud";
import { useAuth } from "./hooks/useAuth";
import { useGeolocation } from "./hooks/useGeolocation";
import { useDriveSession } from "./hooks/useDriveSession";
import { useWakeLock } from "./hooks/useWakeLock";
import { usePersistentState } from "./hooks/usePersistentState";
import { trailDistance } from "./lib/geo";
import { supabase } from "./lib/supabase";

const DEFAULT_ZOOM = 16;

function clampZoom(zoom: number) {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.round(zoom)));
}

function MapScreen() {
  const [zoom, setZoom] = usePersistentState("drive-trail:zoom", DEFAULT_ZOOM);
  const [follow, setFollow] = useState(true);
  const [now, setNow] = useState(() => Date.now());
  const mapRef = useRef<LeafletMap | null>(null);

  const { position, status, error: geoError } = useGeolocation(true);
  const drive = useDriveSession(position);
  const wakeLock = useWakeLock();

  const distanceM = useMemo(() => trailDistance(drive.trail), [drive.trail]);

  // Drives the elapsed-time readout.
  useEffect(() => {
    if (!drive.isRecording) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [drive.isRecording]);

  const onMapReady = useCallback((map: LeafletMap) => {
    mapRef.current = map;
  }, []);

  const handleZoomChange = useCallback(
    (next: number) => setZoom(clampZoom(next)),
    [setZoom],
  );

  const stepZoom = useCallback(
    (delta: number) => setZoom((prev) => clampZoom(prev + delta)),
    [setZoom],
  );

  const recenter = useCallback(() => {
    setFollow(true);
    if (position) mapRef.current?.setView([position.lat, position.lng], zoom, { animate: true });
  }, [position, zoom]);

  const signOut = useCallback(async () => {
    if (drive.isRecording) await drive.stop();
    await supabase.auth.signOut();
  }, [drive]);

  // Location problems matter most; a refused wake lock is worth explaining too.
  const banner = geoError ?? drive.error ?? wakeLock.error;

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#0b0f19]">
      <MapView
        position={position}
        trail={drive.trail}
        zoom={zoom}
        follow={follow}
        onZoomChange={handleZoomChange}
        onUserPan={() => setFollow(false)}
        onMapReady={onMapReady}
      />

      <Hud
        position={position}
        distanceM={distanceM}
        startedAt={drive.startedAt}
        now={now}
        isRecording={drive.isRecording}
        pendingCount={drive.pendingCount}
      />

      <MapControls
        zoom={zoom}
        follow={follow}
        canRecenter={position !== null}
        onZoomIn={() => stepZoom(1)}
        onZoomOut={() => stepZoom(-1)}
        onRecenter={recenter}
      />

      {status === "locating" && !position && (
        <div className="pointer-events-none absolute inset-0 z-[999] flex items-center justify-center">
          <div className="flex items-center gap-3 rounded-xl bg-[#0b0f19]/85 px-4 py-3 text-sm text-white/80 backdrop-blur-md">
            <Spinner size="sm" />
            Finding your location…
          </div>
        </div>
      )}

      {banner && (
        <div className="absolute inset-x-3 top-20 z-[1001] rounded-xl border border-red-500/30 bg-red-950/85 px-3 py-2 text-sm text-red-200 backdrop-blur-md">
          {banner}
        </div>
      )}

      <ControlDock
        isRecording={drive.isRecording}
        busy={drive.busy}
        canRecord={position !== null}
        wakeLock={wakeLock}
        onStart={() => void drive.start()}
        onStop={() => void drive.stop()}
        onSignOut={() => void signOut()}
      />
    </div>
  );
}

export default function App() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-[#0b0f19]">
        <Spinner />
      </div>
    );
  }

  return session ? <MapScreen /> : <LoginScreen />;
}
