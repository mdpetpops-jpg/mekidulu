-- ============================================================================
-- Mekidulu · Visitor tracking + email audit
-- Run once in Supabase → SQL Editor. Idempotent.
-- ============================================================================

create table if not exists public.visitor_logs (
  id          uuid primary key default gen_random_uuid(),
  session_id  text,
  country     text,
  device_type text,
  path        text not null,
  duration    integer not null default 0,
  created_at  timestamptz not null default now()
);

create index if not exists visitor_logs_created_idx on public.visitor_logs (created_at desc);
create index if not exists visitor_logs_session_idx on public.visitor_logs (session_id);

create table if not exists public.email_logs (
  id              uuid primary key default gen_random_uuid(),
  recipient_email text not null,
  subject         text,
  email_body      text,
  email_type      text not null default 'outreach',
  status          text not null default 'sent',
  created_at      timestamptz not null default now()
);

create index if not exists email_logs_created_idx on public.email_logs (created_at desc);
create index if not exists email_logs_recipient_idx on public.email_logs (lower(recipient_email));

do $$
declare t text;
begin
  foreach t in array array['visitor_logs','email_logs'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on table public.%I from anon, authenticated', t);
    execute format('grant select, insert, update, delete on table public.%I to service_role', t);
  end loop;
end $$;

-- De-AI blog prompt: blunt 10-year cat owner, first person, no essay filler.
update public.ai_prompts
set prompt_content = 'You are a cat owner with 10 years of experience. You are blunt and practical, not a copywriter.
Write a ~300 word English article. Rules:
- Never use "In conclusion", "Furthermore", "Moreover", "delve", "landscape", "testament".
- Use first person "I" and spoken, conversational English.
- Open with one concrete scene (a shredded sofa, a wobbling tower, a cat that refuses a bed).
- Explain what fixed it, then mention naturally that Mekidulu cat trees are built heavy enough to survive it.
- Short sentences. No bullet-point essay structure. No call to action.',
    updated_at = now()
where scenario = 'blog_generation';

notify pgrst, 'reload schema';
