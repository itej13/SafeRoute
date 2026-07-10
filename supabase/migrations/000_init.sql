-- SafeRoute — fresh schema. Drops legacy tables and rebuilds with RLS.

drop table if exists public.ratings cascade;
drop table if exists public.profiles cascade;
drop table if exists public.emergency_contacts cascade;

-- Crowd-sourced safety ratings for map points
create table public.ratings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  lat double precision not null check (lat between -90 and 90),
  lng double precision not null check (lng between -180 and 180),
  score int not null check (score between 1 and 5),
  comment text check (char_length(comment) <= 500),
  utilities jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index ratings_lat_lng_idx on public.ratings (lat, lng);

alter table public.ratings enable row level security;

create policy "authenticated can read ratings"
  on public.ratings for select to authenticated using (true);

create policy "users insert own ratings"
  on public.ratings for insert to authenticated
  with check (user_id = auth.uid());

create policy "users update own ratings"
  on public.ratings for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "users delete own ratings"
  on public.ratings for delete to authenticated
  using (user_id = auth.uid());

-- Per-user emergency contacts (private)
create table public.emergency_contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 100),
  phone text not null check (phone ~ '^\+?[0-9 -]{7,15}$'),
  created_at timestamptz not null default now()
);

create index emergency_contacts_user_id_idx on public.emergency_contacts (user_id);

alter table public.emergency_contacts enable row level security;

create policy "users manage own contacts"
  on public.emergency_contacts for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- App is login-gated; anon needs no table access at all
revoke all on public.ratings from anon;
revoke all on public.emergency_contacts from anon;
