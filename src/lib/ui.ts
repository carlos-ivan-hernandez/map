/** Shared treatment for the panels floating over the map. */
export const PANEL = "border border-border bg-surface/85 shadow-lg backdrop-blur-md";

/*
 * Map vectors are drawn on OSM tiles, not on the app surface, so they stay fixed
 * hex rather than theme tokens: they must read over pale tiles in either theme,
 * and Leaflet hands these straight to canvas fillStyle, where oklch() support is
 * patchy on older iOS. All sit on the theme's accent hue.
 */
export const TRAIL_COLOR = "#488fee";
export const TRAIL_CASING = "#121212";
export const POSITION_COLOR = "#296bc2";
/* A reviewed trip draws in the same blue; its green start and red end markers
   and the banner are what set it apart from the live trail. */
export const REVIEW_START = "#16a34a";
export const REVIEW_END = "#dc2626";
