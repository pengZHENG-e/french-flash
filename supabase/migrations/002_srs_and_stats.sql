-- SRS (SM-2 simplified) + streak/daily-goal support.
-- Run this in the Supabase SQL editor against the project DB.

-- 1. Extend word_progress with SM-2 fields.
alter table public.word_progress
  add column if not exists ease_factor    real        not null default 2.5,
  add column if not exists interval_days  integer     not null default 0,
  add column if not exists repetitions    integer     not null default 0,
  add column if not exists next_review_at timestamptz;

-- Seed next_review_at for existing rows so they surface in the review queue.
update public.word_progress
   set next_review_at = coalesce(last_answered_at, now())
 where next_review_at is null;

create index if not exists word_progress_due_idx
  on public.word_progress (user_id, next_review_at)
  where mastered = false;

create index if not exists word_progress_recent_wrong_idx
  on public.word_progress (user_id, last_answered_at desc)
  where wrong_count > 0;

-- 2. Per-user stats: streak + daily goal + today counter.
create table if not exists public.user_stats (
  user_id            uuid        primary key references auth.users(id) on delete cascade,
  current_streak     integer     not null default 0,
  longest_streak     integer     not null default 0,
  last_activity_date date,
  daily_goal         integer     not null default 20,
  today_count        integer     not null default 0,
  today_date         date,
  total_reviews      integer     not null default 0,
  updated_at         timestamptz not null default now()
);

alter table public.user_stats enable row level security;

drop policy if exists "user_stats self-select" on public.user_stats;
create policy "user_stats self-select" on public.user_stats
  for select using (auth.uid() = user_id);

drop policy if exists "user_stats self-upsert" on public.user_stats;
create policy "user_stats self-upsert" on public.user_stats
  for insert with check (auth.uid() = user_id);

drop policy if exists "user_stats self-update" on public.user_stats;
create policy "user_stats self-update" on public.user_stats
  for update using (auth.uid() = user_id);
