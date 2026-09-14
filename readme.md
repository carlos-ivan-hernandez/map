# Map

A single-user PWA that shows where you are on a map and draws a trail of where
you've been during the current driving session. Built to live on a phone
mounted in a car.

- **Map** — Leaflet with raster tiles. No API key, no billing, no quota to sign
  up for. (Google Maps was the original idea, but its JS API requires a
  billing-enabled key, so it isn't a free solution.)
- **Map styles** — seven basemaps in settings, including **Satellite**. See
  [Map styles](#map-styles) below for where they come from.
- **Follow mode** — your position stays pinned to the centre of the screen, and
  zooming never knocks you off centre.
- **Zoom** — `+` / `−` buttons (plus pinch and scroll) across levels 3–19. The
  level you leave it on is remembered across reloads.
- **Quiet chrome** — the bottom bar and zoom controls fade out after 10 seconds
  and come back on any tap, drag or scroll, so the map is mostly unobstructed
  while you drive.
- **Stats** — speed, distance and elapsed time across the top. They stay put
  when the other controls fade; switch them off in settings if you'd rather have
  the bare map. The choice is remembered.
- **Sessions** — each trip is stored in Supabase along with every GPS fix.
- **Past trips** — the route icon in the bottom bar lists every recorded trip;
  pick one to draw it on the map, framed to its own bounds.
- **Scrubber** — reviewing a trip swaps the bottom bar for a scrub bar. Drag it
  and the dot moves through the trip, with the trail drawn in behind it.
- **Settings** — a gear in the bottom bar opens light/dark, the stats readout,
  the keep-the-screen-awake wake lock, and sign out.
- **Theme** — dark by default. The choice is remembered and applied before first
  paint, so there's no flash on load.

## Stack

React 19 · TypeScript · Vite · pnpm · HeroUI v3 (Tailwind v4) · Leaflet ·
Supabase · vite-plugin-pwa

The HeroUI theme tokens and Geist fonts in
[src/index.css](src/index.css) are shared with vera, so the two apps look
like siblings. Map vectors (the trail and position dot) are deliberately fixed
hex rather than theme tokens — they're drawn on OSM tiles, not on the app
surface, so they have to stay legible in either theme.

## Setup

### 1. Install

```sh
pnpm install
```

### 2. Create the Supabase tables

In your Supabase project, open the SQL editor and run
[supabase/migrations/0001_map_sessions.sql](supabase/migrations/0001_map_sessions.sql).

It creates two tables, both prefixed with `map_`:

| Table | What's in it |
| --- | --- |
| `map_sessions` | One row per trip: start, end, total distance, point count |
| `map_session_points` | One row per GPS fix: lat/lng, accuracy, altitude, speed, heading |

Row-level security is on for both, scoped to `auth.uid()`.

### 3. Create your user

Supabase dashboard → **Authentication → Users → Add user**. Use email +
password and tick *Auto Confirm User*. There is no sign-up screen in the app —
it's a single-user tool, so the account is created by hand.

While you're in **Authentication → Providers**, leave Email enabled and turn
off anything else you don't want.

### 4. Point the app at your project

```sh
cp .env.example .env.local
```

Fill in `VITE_SUPABASE_URL` and `VITE_SUPABASE_KEY` from
**Project Settings → API**.

### 5. Run it

```sh
pnpm dev      # http://localhost:5173, also served on your LAN IP
pnpm build    # production build into dist/
pnpm preview  # serve the production build
```

## Using it on your phone

Geolocation and the wake lock both require a **secure context**, so the app has
to be served over HTTPS (or from `localhost`). `pnpm dev --host` over plain HTTP
on a LAN IP will not get you location access.

The simplest route is to deploy `dist/` to any static host that gives you HTTPS
(Netlify, Vercel, Cloudflare Pages, GitHub Pages), then open it on the phone and
use **Add to Home Screen**. It installs as a standalone PWA and keeps recently
viewed tiles cached.

## How a trip works

1. Open the app; it starts watching your location straight away and centres on you.
2. Hit **Start trip**. The blue trail starts drawing behind you. (If the bar has
   faded out, tap anywhere to bring it back.)
3. Fixes are appended when you've moved at least 8 m (or 15 s have passed), which
   keeps GPS jitter out of the trail while you're parked. Anything with accuracy
   worse than 100 m is dropped.
4. Points upload to Supabase in batches — every 15 s, or once 25 have queued.
   The counter in the top bar shows anything still waiting. A failed batch is
   retried on the next flush rather than dropped.
5. **End trip** flushes the rest and writes the total distance and point count
   back to `map_sessions`, then clears the trail so the map goes back to blank.
   The trip is still there under past trips.

If the browser reloads mid-trip, the session id and trail are restored from
`localStorage`, so the trip continues instead of being orphaned.

## Map styles

OpenStreetMap's own tile servers publish exactly one style (Standard) and **no
aerial imagery at all** — OSM is map data, not photography. So the other options
in [src/lib/basemaps.ts](src/lib/basemaps.ts) come from other providers that
serve raster tiles free and without an API key:

| Style | Source |
| --- | --- |
| Standard | OpenStreetMap |
| Satellite | Esri World Imagery (Esri, Maxar, Earthstar Geographics) |
| Voyager, Light, Dark | CARTO basemaps |
| Topographic | OpenTopoMap |
| Humanitarian | OSM France / HOT |

Each carries the attribution its terms require, and the attribution control
swaps with the tiles. All are free for personal-scale use; none needs a key.
Adding another is a matter of appending an entry to that file — though if you add
a host, extend the tile-cache pattern in
[vite.config.ts](vite.config.ts) too, or its tiles won't be cached offline.

Topographic only ships to zoom 17, so past that Leaflet upscales its tiles rather
than showing blank squares.

## Reviewing a past trip

The trips list reads `map_sessions` newest first. Opening one pages through its
points a thousand at a time (Supabase caps a single select) up to 20,000, then
fits the map to the route. The route draws in the same blue as a live trail;
the green start marker and the banner are what tell them apart.

A trip opens fully drawn, with the scrubber at the end. Drag it back and the
trail rewinds to that moment, with the elapsed time, recorded speed and clock
time for that point under the bar. Recording and re-centring are disabled while
you're reviewing — close the banner to go back to live.

## Notes

- These public tile servers are fine for one person's personal use. If you ever
  hammer them, switch styles or add a provider in
  [src/lib/basemaps.ts](src/lib/basemaps.ts).
- Distances are shown in miles and speeds in mph; change `formatDistance` /
  `formatSpeed` in [src/lib/geo.ts](src/lib/geo.ts) for metric.
- Wake Lock is unsupported on some browsers (notably older iOS Safari). The
  settings toggle disables itself and says so when that's the case.
- Recording only runs while the app is in the foreground. Browsers suspend
  geolocation for backgrounded tabs, which is exactly why the keep-awake toggle
  exists.
