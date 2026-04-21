-- Verb conjugation cache + web push subscriptions.

-- 1. Shared conjugation cache. Same conjugation JSON reused across users.
create table if not exists public.word_conjugations (
  word_id    integer     primary key,
  tenses     jsonb       not null,
  model      text,
  created_at timestamptz not null default now()
);

alter table public.word_conjugations enable row level security;

drop policy if exists "word_conjugations read-all" on public.word_conjugations;
create policy "word_conjugations read-all" on public.word_conjugations
  for select using (true);

drop policy if exists "word_conjugations public-insert" on public.word_conjugations;
create policy "word_conjugations public-insert" on public.word_conjugations
  for insert with check (true);

drop policy if exists "word_conjugations public-update" on public.word_conjugations;
create policy "word_conjugations public-update" on public.word_conjugations
  for update using (true);

-- Same permissive write policies for word_hints so server actions can cache
-- with the anon key.
drop policy if exists "word_hints public-insert" on public.word_hints;
create policy "word_hints public-insert" on public.word_hints
  for insert with check (true);
drop policy if exists "word_hints public-update" on public.word_hints;
create policy "word_hints public-update" on public.word_hints
  for update using (true);

-- 2. Web push subscriptions.
create table if not exists public.push_subscriptions (
  id         bigserial   primary key,
  user_id    uuid        not null references auth.users(id) on delete cascade,
  endpoint   text        not null,
  p256dh     text        not null,
  auth       text        not null,
  created_at timestamptz not null default now(),
  unique (user_id, endpoint)
);

alter table public.push_subscriptions enable row level security;

drop policy if exists "push_subs self-select" on public.push_subscriptions;
create policy "push_subs self-select" on public.push_subscriptions
  for select using (auth.uid() = user_id);

drop policy if exists "push_subs self-insert" on public.push_subscriptions;
create policy "push_subs self-insert" on public.push_subscriptions
  for insert with check (auth.uid() = user_id);

drop policy if exists "push_subs self-delete" on public.push_subscriptions;
create policy "push_subs self-delete" on public.push_subscriptions
  for delete using (auth.uid() = user_id);

-- 3. Notification preferences on user_stats.
alter table public.user_stats
  add column if not exists notifications_enabled boolean not null default false,
  add column if not exists weekly_email_enabled  boolean not null default false;
