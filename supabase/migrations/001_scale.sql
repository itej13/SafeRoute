-- Scaling: server-side heatmap aggregation + rating quota.

-- Grid-bucketed heatmap aggregation (~150 m cells): per-viewport egress is
-- O(visible cells) regardless of how many ratings exist.
create or replace function public.heatmap_cells(
  min_lat double precision,
  max_lat double precision,
  min_lng double precision,
  max_lng double precision
)
returns table (lat double precision, lng double precision, avg_score double precision, cnt int)
language sql
stable
security invoker
set search_path = ''
as $$
  select round(r.lat / 0.0015) * 0.0015 as lat,
         round(r.lng / 0.0015) * 0.0015 as lng,
         avg(r.score)::double precision as avg_score,
         count(*)::int as cnt
  from public.ratings r
  where r.lat between min_lat and max_lat
    and r.lng between min_lng and max_lng
  group by 1, 2
  limit 4000
$$;

revoke execute on function public.heatmap_cells from public, anon;
grant execute on function public.heatmap_cells to authenticated;

-- Abuse throttle: one account cannot flood the safety signal.
-- ponytail: fixed 30/day quota; make it configurable if moderation ever needs to
create or replace function public.enforce_rating_quota()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (select count(*) from public.ratings
      where user_id = new.user_id
        and created_at > now() - interval '24 hours') >= 30 then
    raise exception 'rating quota exceeded (30 per 24h)';
  end if;
  return new;
end
$$;

revoke execute on function public.enforce_rating_quota() from public, anon, authenticated;

drop trigger if exists ratings_quota on public.ratings;
create trigger ratings_quota
  before insert on public.ratings
  for each row execute function public.enforce_rating_quota();
