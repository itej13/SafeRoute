# SafeRoute

> Walk safe. Walk confident.

A crowd-sourced women's safety heatmap app built for **Vihaan 9.0 Hackathon, DTU Delhi**.

## Features

- **Live Safety Heatmap** — crowd-sourced ratings rendered as a color-coded heatmap (green = safe, red = unsafe)
- **Rate Any Location** — tap anywhere on the map to submit safety, lighting, and crowd density ratings
- **SOS Emergency Button** — one tap shares GPS location via WhatsApp + quick-dial to 112
- **Emergency Contacts** — save personal contacts that appear on the SOS screen
- **Search** — find any place via free Nominatim geocoding (no API key needed)
- **Google Sign-in** via Supabase Auth

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18 + Vite + TypeScript |
| Styling | Tailwind CSS v3 |
| Routing | React Router v6 |
| Map | Leaflet.js + react-leaflet + OpenStreetMap |
| Heatmap | leaflet.heat |
| Backend | Supabase (Auth + PostgreSQL) |
| Deploy | Vercel |

## Setup

```bash
# 1. Clone & install
cd ~/Developer/SafeRoute
npm install

# 2. Set env vars (already configured in .env)
# VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY

# 3. Run dev server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

## Supabase Tables

```sql
-- profiles
id uuid PRIMARY KEY REFERENCES auth.users,
full_name text,
emergency_contacts jsonb DEFAULT '[]',
created_at timestamptz DEFAULT now()

-- ratings
id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
user_id uuid REFERENCES auth.users,
lat float8,
lng float8,
safety_score int CHECK (safety_score BETWEEN 1 AND 5),
lighting int CHECK (lighting BETWEEN 1 AND 5),
crowd int CHECK (crowd BETWEEN 1 AND 5),
comment text,
created_at timestamptz DEFAULT now()
```

## Deploy to Vercel

```bash
npm run build
# Push to GitHub, then import repo in Vercel
# Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY as environment variables
```

## Dev Seeding

In development, a "Seed 80 Sample Ratings" button appears on the Profile page. Tap it to populate the heatmap with fake data around DTU campus.

---

Built with ❤️ for Vihaan 9.0 · DTU Delhi
