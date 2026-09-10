-- Heart Connect CMS editorial metadata.
-- Additive fields for professional content organization; no existing rows are changed.

alter table public.hc_cms_posts
  add column if not exists category text,
  add column if not exists tags text[] not null default '{}';

alter table public.hc_cms_posts
  drop constraint if exists hc_cms_posts_category_length_check;
alter table public.hc_cms_posts
  add constraint hc_cms_posts_category_length_check
  check (category is null or char_length(category) between 1 and 80);

alter table public.hc_cms_posts
  drop constraint if exists hc_cms_posts_tags_count_check;
alter table public.hc_cms_posts
  add constraint hc_cms_posts_tags_count_check
  check (coalesce(array_length(tags,1),0) <= 20);

create index if not exists hc_cms_posts_category_idx
  on public.hc_cms_posts (category, updated_at desc)
  where deleted_at is null;

create index if not exists hc_cms_posts_tags_gin_idx
  on public.hc_cms_posts using gin (tags);

comment on column public.hc_cms_posts.category is
  'Editorial category used for CMS organization and future public filtering.';
comment on column public.hc_cms_posts.tags is
  'Up to 20 editorial tags. Admin validates and normalizes tag text before saving.';
