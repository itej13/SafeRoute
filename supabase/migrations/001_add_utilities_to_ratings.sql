create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  emergency_contacts jsonb default '[]'::jsonb,
  created_at timestamptz default now() not null
);

alter table profiles enable row level security;

drop policy if exists "Users can read own profile" on profiles;
drop policy if exists "Users can upsert own profile" on profiles;
drop policy if exists "Users can update own profile" on profiles;

create policy "Users can read own profile" on profiles
  for select to authenticated using (auth.uid() = id);

create policy "Users can upsert own profile" on profiles
  for insert to authenticated with check (auth.uid() = id);

create policy "Users can update own profile" on profiles
  for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

create table if not exists ratings (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  lat double precision not null,
  lng double precision not null,
  safety_score integer not null check (safety_score between 1 and 5),
  lighting integer not null check (lighting between 1 and 5),
  crowd integer not null check (crowd between 1 and 5),
  comment text,
  utilities jsonb,
  created_at timestamptz default now() not null
);

alter table ratings add column if not exists utilities jsonb;
alter table ratings enable row level security;

drop policy if exists "Authenticated users can read all ratings" on ratings;
drop policy if exists "Users can insert own ratings" on ratings;
drop policy if exists "Users can update own ratings" on ratings;
drop policy if exists "Users can delete own ratings" on ratings;

create policy "Authenticated users can read all ratings" on ratings
  for select to authenticated using (true);

create policy "Users can insert own ratings" on ratings
  for insert to authenticated with check (auth.uid() = user_id);

create policy "Users can update own ratings" on ratings
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users can delete own ratings" on ratings
  for delete to authenticated using (auth.uid() = user_id);
