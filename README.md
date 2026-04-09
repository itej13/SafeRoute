# SafeRoute

> Walk safe. Walk confident.

A crowd-sourced women's safety app with a live heatmap, route comparison by safety score, and one-tap SOS. Built for **Vihaan 9.0 Hackathon, DTU Delhi**.

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?logo=supabase&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-06B6D4?logo=tailwindcss&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-green)

---

## Features

- **Live Safety Heatmap** — crowd-sourced ratings rendered as a color-coded heatmap (green → safe, red → unsafe)
- **Rate Any Location** — tap anywhere on the map to submit safety, lighting, crowd density, and women's utility ratings (washroom, pharmacy, pad dispenser, police booth)
- **Route Comparison** — compare up to 3 driving alternatives scored by safety data; routes persist on the map when the sheet is minimized
- **Destination Search** — fuzzy autocomplete via Photon/Komoot (no API key required), with distance-from-you display
- **Colored Map Markers** — blue dot for live GPS location, red teardrop pin for selected destination
- **SOS Emergency Button** — one tap shares GPS coordinates via WhatsApp and quick-dials 112
- **Emergency Contacts** — save personal contacts that appear on the SOS screen
- **Google Sign-in** via Supabase Auth

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18 + Vite + TypeScript |
| Styling | Tailwind CSS v3 |
| Routing | React Router v6 |
| Map | Leaflet.js + react-leaflet + OpenStreetMap tiles |
| Heatmap | leaflet.heat |
| Geocoding | Photon by Komoot (free, no key) |
| Routing API | OSRM public demo server |
| Backend | Supabase (Auth + PostgreSQL + Row Level Security) |

---

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project

### 1. Clone & install

```bash
git clone https://github.com/your-username/SafeRoute.git
cd SafeRoute
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Open `.env` and fill in your Supabase project credentials:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

> Find these in your Supabase dashboard → **Project Settings → API**.

### 3. Set up the database

Run the following SQL in your Supabase **SQL Editor**:

```sql
-- Profiles
CREATE TABLE IF NOT EXISTS profiles (
  id                 uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name          text,
  emergency_contacts jsonb DEFAULT '[]'::jsonb,
  created_at         timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"   ON profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can upsert own profile" ON profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Ratings
CREATE TABLE IF NOT EXISTS ratings (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  lat          double precision NOT NULL,
  lng          double precision NOT NULL,
  safety_score integer NOT NULL CHECK (safety_score BETWEEN 1 AND 5),
  lighting     integer NOT NULL CHECK (lighting BETWEEN 1 AND 5),
  crowd        integer NOT NULL CHECK (crowd BETWEEN 1 AND 5),
  comment      text,
  utilities    jsonb,
  created_at   timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read all ratings" ON ratings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert own ratings"             ON ratings FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own ratings"             ON ratings FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own ratings"             ON ratings FOR DELETE TO authenticated USING (auth.uid() = user_id);
```

### 4. Enable Google OAuth

In your Supabase dashboard → **Authentication → Providers → Google**, enable Google and add your OAuth credentials. Add your site URL to the **Redirect URLs** allowlist.

### 5. Run

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## Deployment (Vercel)

```bash
npm run build   # verify it builds locally first
```

1. Push to GitHub and import the repo in [Vercel](https://vercel.com)
2. Add environment variables: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
3. Deploy

---

## Development Utilities

In **development mode**, a "Seed 80 Sample Ratings" button appears on the Profile page to populate the heatmap with synthetic data around DTU campus.

---

## Project Structure

```
src/
├── components/
│   ├── HeatmapLayer.tsx      # leaflet.heat integration
│   ├── Navbar.tsx
│   ├── ProtectedRoute.tsx
│   ├── RatingPanel.tsx       # location rating bottom sheet
│   ├── RouteComparison.tsx   # route comparison + safety scoring
│   └── SOSButton.tsx
├── lib/
│   ├── auth.tsx              # Supabase Auth context
│   ├── geo.ts                # haversine, bbox helpers
│   ├── seedData.ts           # dev-only data seeder
│   ├── supabase.ts           # Supabase client
│   └── types.ts              # shared TypeScript types
├── pages/
│   ├── AuthPage.tsx
│   ├── HomePage.tsx
│   ├── MapPage.tsx           # main map view
│   ├── ProfilePage.tsx
│   └── SOSPage.tsx
supabase/
└── migrations/               # SQL migration files
```

---

## Security Notes

- The **anon key** is safe to use in frontend code — it is restricted by Supabase Row Level Security. **Never commit your `service_role` key.**
- All user data is protected by RLS: users can only modify their own ratings and profiles.
- No third-party analytics or tracking.

---

## Contributing

Pull requests are welcome. For major changes, please open an issue first.

1. Fork the repo
2. Create a feature branch: `git checkout -b feat/my-feature`
3. Commit your changes: `feat:`, `fix:`, `perf:` prefixes
4. Open a pull request

---

## License

[MIT](LICENSE) © 2025 SafeRoute Contributors

---

*Built with ❤️ for Vihaan 9.0 · DTU Delhi*
