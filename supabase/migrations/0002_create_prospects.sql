-- ============================================================================
-- Mekidulu · cold-outreach prospects
-- Run once in the Supabase SQL editor (same project as the site).
-- ============================================================================

create extension if not exists "pgcrypto";

create table if not exists public.prospects (
  id          uuid primary key default gen_random_uuid(),
  email       text        not null,
  store_name  text,
  website     text,
  status      text        not null default 'pending',
  created_at  timestamptz not null default now(),

  -- operational columns (used by the sender)
  sent_at     timestamptz,
  last_error  text,

  constraint prospects_status_allowed
    check (status in ('pending', 'sent', 'failed', 'unsubscribed')),
  constraint prospects_email_format
    check (email ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]{2,}$')
);

comment on table public.prospects is
  'Cold-outreach list. Cron sends one small batch per run and flips pending → sent.';

create unique index if not exists prospects_email_key
  on public.prospects (lower(email));
create index if not exists prospects_queue_idx
  on public.prospects (status, created_at)
  where status = 'pending';

-- Deny-by-default: only the service_role key (server) may read/write.
alter table public.prospects enable row level security;
revoke all on table public.prospects from anon, authenticated;
grant select, insert, update, delete on table public.prospects to service_role;

notify pgrst, 'reload schema';
