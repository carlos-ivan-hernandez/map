import { useEffect, useMemo, useRef } from "react";
import { MapContainer, Polyline, TileLayer, CircleMarker, useMap, useMapEvent } from "react-leaflet";
import { latLngBounds, type LatLngExpression, type Map as LeafletMap } from "leaflet";
import type { TrailPoint } from "../lib/types";
import { findBasemap } from "../lib/basemaps";
import {
  POSITION_COLOR,
  REVIEW_END,
  REVIEW_START,
  TRAIL_CASING,
  TRAIL_COLOR,
} from "../lib/ui";

export const MIN_ZOOM = 3;
export const MAX_ZOOM = 19;

interface MapViewProps {
  position: TrailPoint | null;
  trail: readonly TrailPoint[];
  /** A past trip being reviewed; takes the map over while set. */
  reviewTrail: readonly TrailPoint[];
  /** How far through `reviewTrail` the scrubber sits. */
  reviewIndex: number;
  basemapId: string;
  zoom: number;
  follow: boolean;
  onZoomChange: (zoom: number) => void;
  onUserPan: () => void;
  onMapReady: (map: LeafletMap) => void;
}

const FALLBACK_CENTER: LatLngExpression = [39.8283, -98.5795]; // Geographic centre of the US.

/**
 * Keeps the map obeying two rules: the zoom is whatever the user last chose, and
 * while following, their position stays pinned to the centre of the screen.
 */
function MapSync({
  position,
  zoom,
  follow,
  reviewTrail,
  onZoomChange,
  onUserPan,
  onMapReady,
}: Omit<MapViewProps, "trail" | "reviewIndex" | "basemapId">) {
  const map = useMap();
  const hasCenteredRef = useRef(false);
  // Distinguishes our own programmatic moves from the user dragging the map.
  const selfMoveRef = useRef(false);
  const reviewing = reviewTrail.length > 0;

  useEffect(() => {
    onMapReady(map);
  }, [map, onMapReady]);

  // Frame the whole reviewed trip; its zoom is the trip's, not the saved one.
  useEffect(() => {
    if (reviewTrail.length === 0) return;
    const bounds = latLngBounds(reviewTrail.map((p) => [p.lat, p.lng] as [number, number]));
    map.fitBounds(bounds, { padding: [48, 96], maxZoom: MAX_ZOOM });
  }, [map, reviewTrail]);

  // Apply the remembered zoom level.
  useEffect(() => {
    if (reviewing || map.getZoom() === zoom) return;
    selfMoveRef.current = true;
    map.setZoom(zoom, { animate: true });
  }, [map, zoom, reviewing]);

  // Re-centre on every fix while following, so zooming never drifts off the user.
  useEffect(() => {
    if (!position || reviewing) return;
    if (!follow && hasCenteredRef.current) return;

    selfMoveRef.current = true;
    const target: LatLngExpression = [position.lat, position.lng];

    if (!hasCenteredRef.current) {
      hasCenteredRef.current = true;
      map.setView(target, zoom, { animate: false });
    } else {
      map.setView(target, map.getZoom(), { animate: true, duration: 0.4 });
    }
  }, [map, position, follow, zoom, reviewing]);

  useMapEvent("zoomend", () => {
    const next = map.getZoom();
    if (next !== zoom) onZoomChange(next);
    // A zoom gesture must not knock the user off centre.
    if (follow && position && !reviewing) {
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
  reviewTrail,
  reviewIndex,
  basemapId,
  zoom,
  follow,
  onZoomChange,
  onUserPan,
  onMapReady,
}: MapViewProps) {
  const reviewing = reviewTrail.length > 0;

  const line = useMemo<LatLngExpression[]>(
    () => trail.map((p) => [p.lat, p.lng] as LatLngExpression),
    [trail],
  );

  // Only the part of the trip the scrubber has reached is drawn.
  const reviewLine = useMemo<LatLngExpression[]>(
    () =>
      reviewTrail
        .slice(0, reviewIndex + 1)
        .map((p) => [p.lat, p.lng] as LatLngExpression),
    [reviewTrail, reviewIndex],
  );

  const basemap = findBasemap(basemapId);

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
        // Remount on change so Leaflet swaps the attribution with the tiles.
        key={basemap.id}
        url={basemap.url}
        attribution={basemap.attribution}
        subdomains={basemap.subdomains ?? "abc"}
        maxZoom={MAX_ZOOM}
        maxNativeZoom={basemap.maxNativeZoom}
        detectRetina
      />

      {!reviewing && line.length > 1 && (
        <>
          {/* Dark casing under the trail keeps it readable over pale map areas. */}
          <Polyline positions={line} pathOptions={{ color: TRAIL_CASING, weight: 10, opacity: 0.45 }} />
          <Polyline
            positions={line}
            pathOptions={{ color: TRAIL_COLOR, weight: 5, opacity: 0.95, lineCap: "round" }}
          />
        </>
      )}

      {reviewing && reviewLine.length > 1 && (
        <>
          <Polyline
            positions={reviewLine}
            pathOptions={{ color: TRAIL_CASING, weight: 10, opacity: 0.45 }}
          />
          <Polyline
            positions={reviewLine}
            pathOptions={{ color: TRAIL_COLOR, weight: 5, opacity: 0.95, lineCap: "round" }}
          />
        </>
      )}

      {reviewing && reviewLine.length > 0 && (
        <>
          <CircleMarker
            pane="markerPane"
            center={reviewLine[0]}
            radius={7}
            pathOptions={{ color: "#ffffff", weight: 3, fillColor: REVIEW_START, fillOpacity: 1 }}
          />
          {/* The scrubber's head: where you were at this point in the trip. */}
          <CircleMarker
            pane="markerPane"
            center={reviewLine[reviewLine.length - 1]}
            radius={9}
            pathOptions={{
              color: "#ffffff",
              weight: 3,
              fillColor: reviewIndex >= reviewTrail.length - 1 ? REVIEW_END : POSITION_COLOR,
              fillOpacity: 1,
            }}
          />
        </>
      )}

      {position && !reviewing && (
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
        reviewTrail={reviewTrail}
        zoom={zoom}
        follow={follow}
        onZoomChange={onZoomChange}
        onUserPan={onUserPan}
        onMapReady={onMapReady}
      />
    </MapContainer>
  );
}
