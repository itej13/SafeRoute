<div align="center">

# SafeRoute

**Walk the lit path.** A mobile-first women's safety map of Delhi — rate how safe a street feels,
see the city as a live safety heatmap, compare routes by *safety* as well as speed, and share
your location with trusted contacts in one tap.

[![Live Demo](https://img.shields.io/badge/Live_Demo-saferoute--eosin.vercel.app-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://saferoute-eosin.vercel.app)

[![React](https://img.shields.io/badge/React_18-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com)
[![Leaflet](https://img.shields.io/badge/Leaflet-199900?style=for-the-badge&logo=leaflet&logoColor=white)](https://leafletjs.com)

</div>

---

## Why I built this

"Is this route safe?" is a question maps don't answer — they optimize for *fastest*, not *safest*.
SafeRoute treats safety as a first-class routing signal by fusing two data layers: **official NCRB
crime statistics** for the baseline, and **crowd-sourced street-level ratings** for what the data
misses — lighting, crowds, CCTV, the things you only know by being there. Every walking route is
scored on both, so "safest" and "fastest" sit side by side and the choice is yours.

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
