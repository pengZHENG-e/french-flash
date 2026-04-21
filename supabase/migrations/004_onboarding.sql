-- Placement-test gating.

alter table public.user_stats
  add column if not exists onboarded boolean not null default false;
