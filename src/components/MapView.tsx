import { useEffect, useMemo, useRef } from "react";
import { MapContainer, Polyline, TileLayer, CircleMarker, useMap, useMapEvent } from "react-leaflet";
import type { LatLngExpression, Map as LeafletMap } from "leaflet";
import type { TrailPoint } from "../lib/types";

export const MIN_ZOOM = 3;
export const MAX_ZOOM = 19;

interface MapViewProps {
  position: TrailPoint | null;
  trail: readonly TrailPoint[];
  zoom: number;
  follow: boolean;
  onZoomChange: (zoom: number) => void;
  onUserPan: () => void;
  onMapReady: (map: LeafletMap) => void;
}

const FALLBACK_CENTER: LatLngExpression = [39.8283, -98.5795]; // Geographic centre of the US.

/*
 * Map vectors are drawn on OSM tiles, not on the app surface, so they stay fixed
 * hex rather than theme tokens: they must read over pale tiles in either theme,
 * and Leaflet hands these straight to canvas fillStyle, where oklch() support is
 * patchy on older iOS. Both sit on the theme's accent hue.
 */
const TRAIL_COLOR = "#488fee";
const TRAIL_CASING = "#121212";
const POSITION_COLOR = "#296bc2";

/**
 * Keeps the map obeying two rules: the zoom is whatever the user last chose, and
 * while following, their position stays pinned to the centre of the screen.
 */
function MapSync({
  position,
  zoom,
  follow,
  onZoomChange,
  onUserPan,
  onMapReady,
}: Omit<MapViewProps, "trail">) {
  const map = useMap();
  const hasCenteredRef = useRef(false);
  // Distinguishes our own programmatic moves from the user dragging the map.
  const selfMoveRef = useRef(false);

  useEffect(() => {
    onMapReady(map);
  }, [map, onMapReady]);

  // Apply the remembered zoom level.
  useEffect(() => {
    if (map.getZoom() === zoom) return;
    selfMoveRef.current = true;
    map.setZoom(zoom, { animate: true });
  }, [map, zoom]);

  // Re-centre on every fix while following, so zooming never drifts off the user.
  useEffect(() => {
    if (!position) return;
    if (!follow && hasCenteredRef.current) return;

    selfMoveRef.current = true;
    const target: LatLngExpression = [position.lat, position.lng];

    if (!hasCenteredRef.current) {
      hasCenteredRef.current = true;
      map.setView(target, zoom, { animate: false });
    } else {
      map.setView(target, map.getZoom(), { animate: true, duration: 0.4 });
    }
  }, [map, position, follow, zoom]);

  useMapEvent("zoomend", () => {
    const next = map.getZoom();
    if (next !== zoom) onZoomChange(next);
    // A zoom gesture must not knock the user off centre.
    if (follow && position) {
      selfMoveRef.current = true;
      map.setView([position.lat, position.lng], next, { animate: false });
    }
  });

  useMapEvent("dragstart", () => {
    selfMoveRef.current = false;
    onUserPan();
  });

  useMapEvent("moveend", () => {
    selfMoveRef.current = false;
  });

  return null;
}

export function MapView({
  position,
  trail,
  zoom,
  follow,
  onZoomChange,
  onUserPan,
  onMapReady,
}: MapViewProps) {
  const line = useMemo<LatLngExpression[]>(
    () => trail.map((p) => [p.lat, p.lng] as LatLngExpression),
    [trail],
  );

  const center = position ? ([position.lat, position.lng] as LatLngExpression) : FALLBACK_CENTER;

  return (
    <MapContainer
      className="absolute inset-0 h-full w-full"
      center={center}
      zoom={zoom}
      minZoom={MIN_ZOOM}
      maxZoom={MAX_ZOOM}
      zoomControl={false}
      attributionControl
      zoomSnap={1}
      preferCanvas
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        maxZoom={MAX_ZOOM}
        detectRetina
      />

      {line.length > 1 && (
        <>
          {/* Dark casing under the trail keeps it readable over pale map areas. */}
          <Polyline positions={line} pathOptions={{ color: TRAIL_CASING, weight: 10, opacity: 0.45 }} />
          <Polyline
            positions={line}
            pathOptions={{ color: TRAIL_COLOR, weight: 5, opacity: 0.95, lineCap: "round" }}
          />
        </>
      )}

      {position && (
        <>
          {/* markerPane sits above the trail, so a growing polyline never paints over you. */}
          {position.accuracy !== null && position.accuracy > 25 && (
            <CircleMarker
              pane="markerPane"
              center={[position.lat, position.lng]}
              radius={Math.min(60, position.accuracy / 4)}
              pathOptions={{ color: TRAIL_COLOR, weight: 1, opacity: 0.35, fillOpacity: 0.08 }}
            />
          )}
          <CircleMarker
            pane="markerPane"
            center={[position.lat, position.lng]}
            radius={9}
            pathOptions={{ color: "#ffffff", weight: 3, fillColor: POSITION_COLOR, fillOpacity: 1 }}
          />
        </>
      )}

      <MapSync
        position={position}
        zoom={zoom}
        follow={follow}
        onZoomChange={onZoomChange}
        onUserPan={onUserPan}
        onMapReady={onMapReady}
      />
    </MapContainer>
  );
}
