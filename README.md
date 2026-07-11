# SafeRoute

A mobile-first safety map of Delhi. Rate how safe a street feels, see the city as a safety
heatmap, compare routes by safety as well as speed, and share your location with trusted
contacts in one tap.

## Features

- **Crowd-sourced safety ratings** — tap anywhere on the map to rate a spot (1–5), with
  lighting / crowd / CCTV tags and an optional note.
- **Safety heatmap** — every rating feeds a live heatmap of safe corridors and dark stretches.
- **Area safety + crime map** — your current district's official NCRB crime statistics,
  plus a dark map view with districts glowing gold by reported crime (bundled data;
  labeled clearly as annual official data, not real-time).
- **Route comparison** — pick a destination and compare OSRM route alternatives, each scored
  from nearby ratings and district statistics: safest vs fastest, side by side.
- **One-tap SOS** — shares your exact location with your emergency contacts via the system
  share sheet or WhatsApp.
- **Google sign-in** — ratings and contacts are tied to your account; contacts are private
  to you, enforced by Postgres row-level security.

## Stack

React 18 · TypeScript · Vite · Tailwind CSS · Leaflet + leaflet.heat · Supabase (auth,
Postgres, RLS) · OSRM routing · Photon geocoding · NCRB data via data.gov.in

## Setup

1. `npm install`
2. Copy `.env.example` to `.env` and fill in `VITE_SUPABASE_URL` /
   `VITE_SUPABASE_ANON_KEY` from your Supabase project's API settings.
3. In Supabase, enable the Google auth provider and apply `supabase/migrations/000_init.sql`.
4. `npm run dev`

## Notes

- Routing uses the FOSSGIS public OSRM foot profile — walking routes and walking ETAs.
- Map tiles, routing, and geocoding endpoints are all overridable via env
  (`VITE_TILE_URL`, `VITE_TILE_URL_DARK`, `VITE_TILE_ATTRIBUTION`, `VITE_OSRM_URL`,
  `VITE_PHOTON_URL` — see `.env.example`), so moving to commercial or self-hosted
  providers at scale is a config change, not a code change.
- Crime statistics are district-level and annual (NCRB 2015 via data.gov.in, bundled as
  static JSON in `src/data/`). They are a baseline signal; crowd ratings are the live layer.
