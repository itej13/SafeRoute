# SafeRoute

SafeRoute is a mobile-first women's safety web app built for the Vihaan 9.0 Hackathon at DTU Delhi. It combines crowd-sourced safety ratings, a safety heatmap, route comparison, and one-tap SOS location sharing.

The app uses React, TypeScript, Vite, Tailwind, Leaflet, OSRM routing, Photon geocoding, and Supabase for auth, PostgreSQL, storage, and RLS. Core pages include map, SOS, auth, and profile, with ratings and emergency contacts stored per user.

Current status: functional hackathon app. Known limits include reliance on public OSRM, manual heatmap refresh, no offline support, and route scoring that can miss ratings outside the current bounding-box buffer.

Source: `Memory/wiki/projects/saferoute.md`
