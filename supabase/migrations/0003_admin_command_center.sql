-- ============================================================================
-- Mekidulu · Admin Command Center
-- Run once in Supabase → SQL Editor. Safe to re-run (idempotent).
-- ============================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------- ai_prompts
create table if not exists public.ai_prompts (
  id             uuid primary key default gen_random_uuid(),
  scenario       text        not null,
  prompt_content text        not null,
  is_active      boolean     not null default true,
  updated_at     timestamptz not null default now()
);

create unique index if not exists ai_prompts_scenario_key
  on public.ai_prompts (scenario);

-- ------------------------------------------------------------------- ai_logs
create table if not exists public.ai_logs (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz not null default now(),
  scenario        text        not null,
  input_prompt    text,
  output_response text,
  tokens_used     integer     not null default 0,
  status          text        not null default 'success',
  duration_ms     integer
);

create index if not exists ai_logs_created_idx on public.ai_logs (created_at desc);
create index if not exists ai_logs_status_idx  on public.ai_logs (status, created_at desc);

-- ---------------------------------------------------------------- leads (extend)
-- The site already writes business_email / estimated_volume; the dashboard reads
-- email / volume. Keep both, synced by trigger, so nothing breaks either way.
create table if not exists public.leads (
  id               uuid primary key default gen_random_uuid(),
  created_at       timestamptz not null default now(),
  email            text,
  business_email   text,
  company_name     text,
  volume           text,
  estimated_volume text,
  notes            text,
  status           text        not null default 'new',
  source           text        default 'website',
  page_path        text,
  referrer         text,
  user_agent       text
);

alter table public.leads add column if not exists email text;
alter table public.leads add column if not exists volume text;
alter table public.leads add column if not exists company_name text;
alter table public.leads add column if not exists notes text;
alter table public.leads add column if not exists page_path text;
alter table public.leads add column if not exists referrer text;
alter table public.leads add column if not exists user_agent text;
alter table public.leads add column if not exists source text default 'website';

update public.leads set email  = coalesce(email, business_email)      where email is null;
update public.leads set volume = coalesce(volume, estimated_volume)   where volume is null;

create or replace function public.tg_leads_sync_columns()
returns trigger
language plpgsql
as $$
begin
  if new.email is null then new.email := new.business_email; end if;
  if new.business_email is null then new.business_email := new.email; end if;
  if new.volume is null then new.volume := new.estimated_volume; end if;
  if new.estimated_volume is null then new.estimated_volume := new.volume; end if;
  return new;
end;
$$;

drop trigger if exists leads_sync_columns on public.leads;
create trigger leads_sync_columns
  before insert or update on public.leads
  for each row execute function public.tg_leads_sync_columns();

create index if not exists leads_created_idx on public.leads (created_at desc);

-- ------------------------------------------------------------ outreach_emails
create table if not exists public.outreach_emails (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  store_name    text,
  email         text        not null,
  website       text,
  fetch_status  text        default 'pending',
  send_status   text        default 'pending',
  reply_status  text        default 'none',
  reply_content text
);

create index if not exists outreach_pending_idx
  on public.outreach_emails (created_at)
  where send_status = 'pending';
create index if not exists outreach_email_idx
  on public.outreach_emails (lower(email));

-- ---------------------------------------------------------------- blog_posts
create table if not exists public.blog_posts (
  id          uuid primary key default gen_random_uuid(),
  slug        text        not null unique,
  title       text        not null,
  content     text        not null default '',
  cover_image text,
  status      text        not null default 'draft',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint blog_posts_status_allowed check (status in ('draft', 'published'))
);

create index if not exists blog_posts_status_idx on public.blog_posts (status, created_at desc);

create or replace function public.tg_blog_touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists blog_posts_touch on public.blog_posts;
create trigger blog_posts_touch
  before update on public.blog_posts
  for each row execute function public.tg_blog_touch_updated_at();

-- -------------------------------------------------------------- traffic_logs
create table if not exists public.traffic_logs (
  id         uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  path       text not null,
  referrer   text,
  ip_hash    text
);

create index if not exists traffic_created_idx on public.traffic_logs (created_at desc);
create index if not exists traffic_path_idx    on public.traffic_logs (path);

-- ------------------------------------------------------------------- security
-- Server-only tables: RLS on, no policies, and no grants for anon/authenticated.
do $$
declare t text;
begin
  foreach t in array array[
    'ai_prompts','ai_logs','leads','outreach_emails','blog_posts','traffic_logs'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on table public.%I from anon, authenticated', t);
    execute format('grant select, insert, update, delete on table public.%I to service_role', t);
  end loop;
end $$;

-- ------------------------------------------------------------ default prompts
insert into public.ai_prompts (scenario, prompt_content, is_active)
values
  ('outreach_email', 'You are the export sales director of Mekidulu, a Chinese manufacturer of heavy-duty birch cat furniture.
Write a 90-110 word plain-text B2B cold email to an independent pet retailer.
Mention: low MOQ from 5 units, dropshipping supported, factory-direct pricing. One low-friction closing question. No prices, no delivery promises, no emoji.
Return only the email body.', true),
  ('blog_generation', 'You are a senior pet-industry blogger writing for Mekidulu.
Given a real question Western cat owners are discussing online, write a ~500 word English Q&A blog post.
Return TITLE: and SUMMARY: lines, then ---, then a Markdown body with ## sections, a bullet list and a short FAQ.
Naturally mention Mekidulu''s heavy-duty birch cat trees (25 mm base plate, 10x10 cm columns, wipe-clean wood) without hard selling.', true),
  ('support_reply', 'You are a structural engineer at Mekidulu with 10 years of experience in heavy-duty cat trees.
Answer briefly and concretely about load, stability, anti-slip and wholesale. Never invent numbers.', true),
  ('lead_thankyou', 'You are the export sales director of Mekidulu. Write a 100-word English thank-you email replying to a wholesale inquiry. Warm, specific, no prices. Sign as "Mekidulu Sales Team".', true)
on conflict (scenario) do nothing;

notify pgrst, 'reload schema';
