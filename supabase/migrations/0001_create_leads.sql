-- ============================================================================
-- Mekidulu · B2B lead capture
-- Run this once in the Supabase SQL editor (or via `supabase db push`).
-- Table: public.leads  ·  Written only by the server (service_role).
-- ============================================================================

create extension if not exists "pgcrypto";

create table if not exists public.leads (
  id                uuid primary key default gen_random_uuid(),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),

  -- Contact
  business_email    text        not null,
  company_name      text,
  estimated_volume  text,
  notes             text,

  -- Pipeline
  status            text        not null default 'new',

  -- Attribution
  source            text        not null default 'website',
  page_path         text,
  referrer          text,
  user_agent        text,

  constraint leads_business_email_format
    check (business_email ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]{2,}$'),
  constraint leads_business_email_length
    check (char_length(business_email) <= 254),
  constraint leads_estimated_volume_allowed
    check (estimated_volume is null or estimated_volume in ('10-50', '50-200', '200+')),
  constraint leads_status_allowed
    check (status in ('new', 'contacted', 'qualified', 'won', 'lost'))
);

comment on table  public.leads is
  'B2B wholesale inquiries submitted from /wholesale. Rows are created by the Next.js API route using the service_role key.';
comment on column public.leads.estimated_volume is
  'Volume band chosen on the form: 10-50 | 50-200 | 200+.';
comment on column public.leads.status is
  'Manual sales-pipeline state: new | contacted | qualified | won | lost.';

-- Sales team sorts by newest first and filters the "new" queue.
create index if not exists leads_created_at_desc_idx
  on public.leads (created_at desc);
create index if not exists leads_business_email_idx
  on public.leads (lower(business_email));
create index if not exists leads_new_queue_idx
  on public.leads (created_at desc)
  where status = 'new';

-- Keep updated_at honest when the sales team moves a lead.
create or replace function public.tg_leads_touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists leads_touch_updated_at on public.leads;
create trigger leads_touch_updated_at
  before update on public.leads
  for each row
  execute function public.tg_leads_touch_updated_at();

-- ---------------------------------------------------------------------------
-- Security: deny-by-default.
-- RLS is enabled and NO policies are defined, so anon/authenticated keys can
-- neither read nor write leads (they contain business contact data). The API
-- route uses the service_role key, which bypasses RLS by design.
-- ---------------------------------------------------------------------------
alter table public.leads enable row level security;

revoke all on table public.leads from anon, authenticated;
grant select, insert, update, delete on table public.leads to service_role;

-- ---------------------------------------------------------------------------
-- Verification (run after the migration):
--   select column_name, data_type, is_nullable
--     from information_schema.columns
--    where table_schema = 'public' and table_name = 'leads'
--    order by ordinal_position;
--
--   select relrowsecurity from pg_class where oid = 'public.leads'::regclass;
--   -- expected: true
--
--   select * from public.leads order by created_at desc limit 5;
-- ---------------------------------------------------------------------------
