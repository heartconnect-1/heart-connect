-- Heart Connect native page-management foundation.
-- Core pages are seeded as drafts only. Nothing in this migration publishes
-- content or changes the current public-site renderer.

create table if not exists public.hc_site_page_revisions (
  id uuid primary key default gen_random_uuid(),
  page_id uuid not null references public.hc_site_pages(id) on delete cascade,
  revision_number integer not null check (revision_number > 0),
  snapshot jsonb not null,
  editor_user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique(page_id, revision_number)
);

alter table public.hc_site_page_revisions enable row level security;
revoke all on public.hc_site_page_revisions from anon, authenticated;
grant all on public.hc_site_page_revisions to service_role;

create index if not exists hc_site_page_revisions_page_idx
  on public.hc_site_page_revisions (page_id, revision_number desc);

comment on table public.hc_site_page_revisions is
  'Server-only snapshots of site pages captured before Admin edits.';

insert into public.hc_site_pages
  (slug,title,page_type,status,content,seo_title,seo_description)
values
  (
    'home','Home','home','draft',
    '{"template":"home","hero":{"title":"Meet people who want something real","subtitle":"Heart Connect is being prepared as a safer international dating community.","cta":{"label":"Join Heart Connect","href":"/signup"}},"sections":[{"type":"feature_grid","title":"Built for meaningful connections","items":["Discover compatible people","Connect with mutual matches","Use safety and verification tools"]},{"type":"cta","title":"Ready to connect?","body":"Create your profile and start discovering people when this page is approved for publication.","button":{"label":"Create profile","href":"/signup"}}],"editorial":{"reviewRequired":true}}'::jsonb,
    'Heart Connect | Meaningful International Dating',
    'Meet people, build genuine connections and use Heart Connect safety and verification tools.'
  ),
  (
    'about','About Heart Connect','content','draft',
    '{"template":"about","hero":{"title":"About Heart Connect","subtitle":"A global dating platform focused on genuine connections, privacy and member safety."},"sections":[{"type":"text","title":"Our purpose","body":"Help adults meet and build meaningful relationships across cities and countries."},{"type":"text","title":"How we build trust","body":"Safety tools, verification workflows, moderation and clear member controls are part of the platform design."}],"editorial":{"reviewRequired":true}}'::jsonb,
    'About Heart Connect',
    'Learn about Heart Connect, our purpose and the trust and safety principles behind the platform.'
  ),
  (
    'safety','Safety Center','help','draft',
    '{"template":"safety","hero":{"title":"Safety Center","subtitle":"Practical tools and guidance for safer online and in-person dating."},"sections":[{"type":"feature_grid","title":"Protect your account","items":["Keep login credentials private","Use verification features when available","Report suspicious behaviour"]},{"type":"text","title":"Meeting in person","body":"Choose a public place, tell someone you trust where you are going and arrange your own transport."},{"type":"text","title":"Urgent danger","body":"If you are in immediate danger, contact local emergency services."}],"editorial":{"reviewRequired":true}}'::jsonb,
    'Heart Connect Safety Center',
    'Safety guidance for Heart Connect members, including account protection, reporting and safer in-person meetings.'
  ),
  (
    'community-guidelines','Community Guidelines','legal','draft',
    '{"template":"legal","hero":{"title":"Community Guidelines","subtitle":"Standards intended to support respectful, authentic and safe participation."},"sections":[{"type":"text","title":"Draft for review","body":"This page is a structured placeholder and must receive policy and legal review before publication."}],"editorial":{"legalReviewRequired":true,"reviewRequired":true}}'::jsonb,
    'Heart Connect Community Guidelines',
    'Draft community standards for respectful and safe participation on Heart Connect.'
  ),
  (
    'help','Help Center','help','draft',
    '{"template":"help","hero":{"title":"Help Center","subtitle":"Find guidance for profiles, matching, privacy, payments, safety and account support."},"sections":[{"type":"faq","title":"Popular help topics","items":[{"question":"How do I manage my profile?","answer":"Use your account and profile settings."},{"question":"How do I report a concern?","answer":"Use the report tools available from the relevant profile or interaction."},{"question":"How do I get account support?","answer":"Use the support route shown in Heart Connect."}]}],"editorial":{"reviewRequired":true}}'::jsonb,
    'Heart Connect Help Center',
    'Get help with Heart Connect profiles, matching, privacy, safety, payments and account support.'
  ),
  (
    'privacy','Privacy Policy','legal','draft',
    '{"template":"legal","hero":{"title":"Privacy Policy","subtitle":"Draft page awaiting formal privacy and legal review."},"sections":[{"type":"text","title":"Do not publish yet","body":"This is a page-management placeholder only. Final privacy disclosures must reflect the actual production data practices, vendors, retention rules and applicable markets before publication."}],"editorial":{"legalReviewRequired":true,"reviewRequired":true}}'::jsonb,
    'Heart Connect Privacy Policy',
    'Draft privacy-policy page for Heart Connect. Formal legal review is required before publication.'
  ),
  (
    'terms','Terms of Service','legal','draft',
    '{"template":"legal","hero":{"title":"Terms of Service","subtitle":"Draft page awaiting formal terms and market review."},"sections":[{"type":"text","title":"Do not publish yet","body":"This is a page-management placeholder only. Final terms must be reviewed for the actual service, payment model, safety rules and launch markets before publication."}],"editorial":{"legalReviewRequired":true,"reviewRequired":true}}'::jsonb,
    'Heart Connect Terms of Service',
    'Draft terms-of-service page for Heart Connect. Formal legal review is required before publication.'
  ),
  (
    'contact','Contact & Support','help','draft',
    '{"template":"contact","hero":{"title":"Contact Heart Connect","subtitle":"Use official Heart Connect support channels for account and safety assistance."},"sections":[{"type":"text","title":"Support details","body":"Add the final support email, response expectations and emergency guidance before publishing this page."}],"editorial":{"reviewRequired":true}}'::jsonb,
    'Contact Heart Connect',
    'Contact Heart Connect for account, safety and platform support.'
  )
on conflict (slug) do nothing;
