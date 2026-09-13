import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Map as LeafletMap } from "leaflet";
import { Spinner } from "@heroui/react";
import { LoginScreen } from "./components/LoginScreen";
import { MapView, MAX_ZOOM, MIN_ZOOM } from "./components/MapView";
import { MapControls } from "./components/MapControls";
import { ControlDock } from "./components/ControlDock";
import { SettingsModal } from "./components/SettingsModal";
import { TripsModal } from "./components/TripsModal";
import { ReviewBanner } from "./components/ReviewBanner";
import { Hud } from "./components/Hud";
import { useAuth } from "./hooks/useAuth";
import { useGeolocation } from "./hooks/useGeolocation";
import { useDriveSession } from "./hooks/useDriveSession";
import { useWakeLock } from "./hooks/useWakeLock";
import { usePersistentState } from "./hooks/usePersistentState";
import { useTheme } from "./hooks/useTheme";
import { useIdleChrome } from "./hooks/useIdleChrome";
import { useTrips } from "./hooks/useTrips";
import { trailDistance } from "./lib/geo";
import { supabase } from "./lib/supabase";
import { PANEL } from "./lib/ui";
import type { DriveSession, TrailPoint } from "./lib/types";

const DEFAULT_ZOOM = 16;

function clampZoom(zoom: number) {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.round(zoom)));
}

interface ReviewState {
  trip: DriveSession;
  points: TrailPoint[];
}

function MapScreen({ email }: { email: string | null }) {
  const [zoom, setZoom] = usePersistentState("map:zoom", DEFAULT_ZOOM);
  const [statsShown, setStatsShown] = usePersistentState("map:stats", true);
  const [follow, setFollow] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [tripsOpen, setTripsOpen] = useState(false);
  const [review, setReview] = useState<ReviewState | null>(null);
  const [loadingTripId, setLoadingTripId] = useState<string | null>(null);
  const [tripError, setTripError] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const mapRef = useRef<LeafletMap | null>(null);

  const { position, status, error: geoError } = useGeolocation(true);
  const drive = useDriveSession(position);
  const wakeLock = useWakeLock();
  const { theme, setTheme } = useTheme();
  const { loadPoints } = useTrips();

  // Modals cover the map, so don't let the chrome time out underneath them.
  const chrome = useIdleChrome({ paused: settingsOpen || tripsOpen });

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

  const handleZoomChange = useCallback((next: number) => setZoom(clampZoom(next)), [setZoom]);

  const stepZoom = useCallback(
    (delta: number) => setZoom((prev) => clampZoom(prev + delta)),
    [setZoom],
  );

  const recenter = useCallback(() => {
    setFollow(true);
    if (position) mapRef.current?.setView([position.lat, position.lng], zoom, { animate: true });
  }, [position, zoom]);

  const signOut = useCallback(async () => {
    setSettingsOpen(false);
    await supabase.auth.signOut();
  }, []);

  const openTrip = useCallback(
    async (trip: DriveSession) => {
      setLoadingTripId(trip.id);
      setTripError(null);
      try {
        const points = await loadPoints(trip.id);
        if (points.length === 0) {
          setTripError("That trip has no recorded points.");
          return;
        }
        setReview({ trip, points });
        setFollow(false);
        setTripsOpen(false);
      } catch (cause) {
        setTripError(cause instanceof Error ? cause.message : "Could not load that trip.");
      } finally {
        setLoadingTripId(null);
      }
    },
    [loadPoints],
  );

  const exitReview = useCallback(() => {
    setReview(null);
    setFollow(true);
    chrome.show();
  }, [chrome]);

  const reviewing = review !== null;
  const banner = geoError ?? drive.error ?? wakeLock.error ?? tripError;

  return (
    <div
      className="relative h-full w-full overflow-hidden bg-background"
      // Any real input brings the chrome back and restarts its countdown.
      onPointerDown={chrome.show}
      onWheel={chrome.show}
    >
      <MapView
        position={position}
        trail={drive.trail}
        reviewTrail={review?.points ?? []}
        zoom={zoom}
        follow={follow}
        onZoomChange={handleZoomChange}
        onUserPan={() => setFollow(false)}
        onMapReady={onMapReady}
      />

      {reviewing ? (
        <ReviewBanner
          trip={review.trip}
          pointCount={review.points.length}
          onExit={exitReview}
        />
      ) : (
        statsShown && (
          <Hud
            position={position}
            distanceM={distanceM}
            startedAt={drive.startedAt}
            now={now}
            isRecording={drive.isRecording}
            pendingCount={drive.pendingCount}
          />
        )
      )}

      {/* Zoom controls and the dock fade out once you stop touching the screen. */}
      <MapControls
        visible={chrome.visible}
        zoom={zoom}
        follow={follow}
        canRecenter={position !== null && !reviewing}
        onZoomIn={() => stepZoom(1)}
        onZoomOut={() => stepZoom(-1)}
        onRecenter={recenter}
      />

      <ControlDock
        visible={chrome.visible}
        isRecording={drive.isRecording}
        busy={drive.busy}
        canRecord={position !== null && !reviewing}
        onStart={() => void drive.start()}
        onStop={() => void drive.stop()}
        onOpenTrips={() => setTripsOpen(true)}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      {status === "locating" && !position && !reviewing && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-foreground ${PANEL}`}>
            <Spinner size="sm" />
            Finding your location…
          </div>
        </div>
      )}

      {banner && (
        <div className="absolute inset-x-3 top-20 z-[1001] rounded-lg border border-danger/40 bg-danger/15 px-3 py-2 text-sm text-danger backdrop-blur-md">
          {banner}
        </div>
      )}

      <TripsModal
        isOpen={tripsOpen}
        activeTripId={review?.trip.id ?? null}
        loadingTripId={loadingTripId}
        onSelect={(trip) => void openTrip(trip)}
        onClose={() => setTripsOpen(false)}
      />

      <SettingsModal
        isOpen={settingsOpen}
        theme={theme}
        statsShown={statsShown}
        email={email}
        wakeLock={wakeLock}
        isRecording={drive.isRecording}
        onThemeChange={setTheme}
        onStatsShownChange={setStatsShown}
        onSignOut={() => void signOut()}
        onClose={() => setSettingsOpen(false)}
      />
    </div>
  );
}

export default function App() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-background">
        <Spinner />
      </div>
    );
  }

  return session ? <MapScreen email={session.user.email ?? null} /> : <LoginScreen />;
}
