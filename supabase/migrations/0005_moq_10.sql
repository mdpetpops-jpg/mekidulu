-- ============================================================================
-- Mekidulu · MOQ 5 → 10
-- Widens the allowed volume bands without touching existing rows.
-- Run once in the Supabase SQL editor.
-- ============================================================================

alter table public.leads drop constraint if exists leads_estimated_volume_allowed;

alter table public.leads
  add constraint leads_estimated_volume_allowed
  check (
    estimated_volume is null
    or estimated_volume in ('10-50', '50-200', '200+', '5-50')  -- '5-50' kept for historical rows
  );

comment on column public.leads.estimated_volume is
  'Volume band chosen on the form: 10-50 | 50-200 | 200+ (5-50 retained for legacy rows).';

-- The live outreach prompt should state the real MOQ.
update public.ai_prompts
set prompt_content = replace(replace(prompt_content, 'from 5 units', 'from 10 units'), 'exactly 5 units', 'exactly 10 units'),
    updated_at = now()
where scenario in ('outreach_email', 'blog_generation', 'support_chat', 'support_reply', 'lead_thankyou');

notify pgrst, 'reload schema';
