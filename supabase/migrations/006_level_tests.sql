-- Level test history.
create table if not exists public.level_tests (
  id         bigserial   primary key,
  user_id    uuid        not null references auth.users(id) on delete cascade,
  level      text        not null,                 -- A1 | A2 | B1 | B2 | C1 | PRE
  correct    integer     not null,                 -- total correct (0..20)
  total      integer     not null,                 -- total questions
  scores     jsonb       not null,                 -- {"A1": {"correct":4,"total":4}, ...}
  taken_at   timestamptz not null default now()
);

create index if not exists level_tests_user_taken_idx
  on public.level_tests (user_id, taken_at desc);

alter table public.level_tests enable row level security;

drop policy if exists "level_tests self-select" on public.level_tests;
create policy "level_tests self-select" on public.level_tests
  for select using (auth.uid() = user_id);

drop policy if exists "level_tests self-insert" on public.level_tests;
create policy "level_tests self-insert" on public.level_tests
  for insert with check (auth.uid() = user_id);
