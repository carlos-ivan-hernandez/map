/*
 * OpenStreetMap's own tile servers publish exactly one style (Standard) and no
 * aerial imagery at all — OSM is map data, not photography. So satellite and the
 * other looks come from other providers that serve raster tiles free and without
 * an API key. Each carries the attribution its terms require.
 */
export interface Basemap {
  id: string;
  label: string;
  description: string;
  url: string;
  attribution: string;
  subdomains?: string;
  /** Highest zoom the provider actually ships; past this Leaflet upscales. */
  maxNativeZoom: number;
}

export const BASEMAPS: Basemap[] = [
  {
    id: "standard",
    label: "Standard",
    description: "The classic OpenStreetMap look",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    subdomains: "abc",
    maxNativeZoom: 19,
  },
  {
    id: "satellite",
    label: "Satellite",
    description: "Aerial imagery",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "Imagery &copy; Esri, Maxar, Earthstar Geographics",
    maxNativeZoom: 19,
  },
  {
    id: "voyager",
    label: "Voyager",
    description: "Softer colours, clear labels",
    url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>, &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: "abcd",
    maxNativeZoom: 20,
  },
  {
    id: "light",
    label: "Light",
    description: "Muted, minimal detail",
    url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>, &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: "abcd",
    maxNativeZoom: 20,
  },
  {
    id: "dark",
    label: "Dark",
    description: "Easiest on the eyes at night",
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>, &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: "abcd",
    maxNativeZoom: 20,
  },
  {
    id: "topographic",
    label: "Topographic",
    description: "Contours and terrain",
    url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>, &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (CC-BY-SA)',
    subdomains: "abc",
    maxNativeZoom: 17,
  },
  {
    id: "humanitarian",
    label: "Humanitarian",
    description: "High contrast, heavy on detail",
    url: "https://tile-{s}.openstreetmap.fr/hot/{z}/{x}/{y}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>, tiles by <a href="https://www.hotosm.org/">HOT</a>',
    subdomains: "ab",
    maxNativeZoom: 20,
  },
];

export const DEFAULT_BASEMAP = BASEMAPS[0].id;

export function findBasemap(id: string): Basemap {
  return BASEMAPS.find((b) => b.id === id) ?? BASEMAPS[0];
}
