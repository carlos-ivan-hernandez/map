# Drive Trail

A single-user PWA that shows where you are on a map and draws a trail of where
you've been during the current driving session. Built to live on a phone
mounted in a car.

- **Map** — Leaflet with OpenStreetMap raster tiles. No API key, no billing, no
  quota to sign up for. (Google Maps was the original idea, but its JS API
  requires a billing-enabled key, so it isn't a free solution.)
- **Follow mode** — your position stays pinned to the centre of the screen, and
  zooming never knocks you off centre.
- **Zoom** — `+` / `−` buttons (plus pinch and scroll) across levels 3–19. The
  level you leave it on is remembered across reloads.
- **Keep awake** — a toggle that holds a screen wake lock so the phone doesn't
  sleep mid-drive.
- **Sessions** — each drive is stored in Supabase along with every GPS fix.

## Stack

React 19 · TypeScript · Vite · pnpm · HeroUI v3 (Tailwind v4) · Leaflet ·
Supabase · vite-plugin-pwa

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
| `map_sessions` | One row per drive: start, end, total distance, point count |
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

Fill in `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from
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

## How a drive works

1. Open the app; it starts watching your location straight away and centres on you.
2. Hit **Start drive**. The blue trail starts drawing behind you.
3. Fixes are appended when you've moved at least 8 m (or 15 s have passed), which
   keeps GPS jitter out of the trail while you're parked. Anything with accuracy
   worse than 100 m is dropped.
4. Points upload to Supabase in batches — every 15 s, or once 25 have queued.
   The counter in the top bar shows anything still waiting. A failed batch is
   retried on the next flush rather than dropped.
5. **End drive** flushes the rest and writes the total distance and point count
   back to `map_sessions`.

If the browser reloads mid-drive, the session id and trail are restored from
`localStorage`, so the drive continues instead of being orphaned.

## Notes

- OSM's public tile servers are fine for one person's personal use. If you ever
  hammer them, switch the `TileLayer` url in
  [src/components/MapView.tsx](src/components/MapView.tsx) to another provider.
- Distances are shown in miles and speeds in mph; change `formatDistance` /
  `formatSpeed` in [src/lib/geo.ts](src/lib/geo.ts) for metric.
- Wake Lock is unsupported on some browsers (notably older iOS Safari). The
  toggle disables itself and reads "No lock" when that's the case.
- Recording only runs while the app is in the foreground. Browsers suspend
  geolocation for backgrounded tabs, which is exactly why the keep-awake toggle
  exists.
