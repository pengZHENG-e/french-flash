-- XP + achievements.

alter table public.user_stats
  add column if not exists total_xp          integer not null default 0,
  add column if not exists goals_hit_total   integer not null default 0,
  add column if not exists level_tests_taken integer not null default 0;

alter table public.daily_activity
  add column if not exists xp_earned integer not null default 0;

create table if not exists public.user_achievements (
  user_id     uuid        not null references auth.users(id) on delete cascade,
  achievement text        not null,
  unlocked_at timestamptz not null default now(),
  primary key (user_id, achievement)
);

alter table public.user_achievements enable row level security;

drop policy if exists "achievements self-select" on public.user_achievements;
create policy "achievements self-select" on public.user_achievements
  for select using (auth.uid() = user_id);

drop policy if exists "achievements self-insert" on public.user_achievements;
create policy "achievements self-insert" on public.user_achievements
  for insert with check (auth.uid() = user_id);
