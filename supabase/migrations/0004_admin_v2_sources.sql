-- ============================================================================
-- Mekidulu · Admin v2 (prospecting sources + support-chat prompt)
-- Run after 0003. Idempotent.
-- ============================================================================

-- A prospect may start as a domain only; the crawler fills the address later.
alter table public.outreach_emails alter column email drop not null;

alter table public.outreach_emails add column if not exists source text default 'manual';
alter table public.outreach_emails add column if not exists found_at timestamptz;

create index if not exists outreach_source_idx on public.outreach_emails (source);
create index if not exists outreach_fetch_idx
  on public.outreach_emails (created_at)
  where fetch_status is null or fetch_status = 'pending';

comment on column public.outreach_emails.source is
  'Where the address came from: manual | linkedin | forum | blog | website | marketplace';

-- The support widget sends its live product/manual context as a suffix, so this
-- prompt only needs the persona.
insert into public.ai_prompts (scenario, prompt_content, is_active)
values (
  'support_chat',
  'You are the support engineer for Mekidulu, a maker of heavy-duty wood cat furniture. Answer in the customer''s language; keep part codes and model names untranslated; never invent load ratings or prices.',
  true
)
on conflict (scenario) do nothing;

notify pgrst, 'reload schema';
