-- New-word quota + AI mnemonic cache.

-- 1. Per-user new-word limits.
alter table public.user_stats
  add column if not exists daily_new_goal   integer not null default 10,
  add column if not exists today_new_count  integer not null default 0;

-- 2. Shared AI-generated hints cache (same hint reused across users for a word).
create table if not exists public.word_hints (
  word_id    integer     primary key,
  mnemonic   text        not null,
  examples   jsonb,                 -- optional extra examples
  model      text,
  created_at timestamptz not null default now()
);

alter table public.word_hints enable row level security;

drop policy if exists "word_hints read-all" on public.word_hints;
create policy "word_hints read-all" on public.word_hints
  for select using (true);

-- Writes happen server-side via service role; no insert/update policy needed.

-- 3. Per-user per-day review counter for heatmap.
create table if not exists public.daily_activity (
  user_id      uuid        not null references auth.users(id) on delete cascade,
  day          date        not null,
  review_count integer     not null default 0,
  correct      integer     not null default 0,
  wrong        integer     not null default 0,
  primary key (user_id, day)
);

alter table public.daily_activity enable row level security;

drop policy if exists "daily_activity self-select" on public.daily_activity;
create policy "daily_activity self-select" on public.daily_activity
  for select using (auth.uid() = user_id);

drop policy if exists "daily_activity self-upsert" on public.daily_activity;
create policy "daily_activity self-upsert" on public.daily_activity
  for insert with check (auth.uid() = user_id);

drop policy if exists "daily_activity self-update" on public.daily_activity;
create policy "daily_activity self-update" on public.daily_activity
  for update using (auth.uid() = user_id);
