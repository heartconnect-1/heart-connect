-- Heart Connect main-home showcase CMS.
-- Main marketing home (/) is managed separately from the authenticated member home (/app).

create table if not exists public.hc_homepage_showcase (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  age integer check (age is null or (age >= 18 and age <= 100)),
  city text,
  country text,
  relationship_intention text,
  tagline text,
  photo_storage_path text,
  is_active boolean not null default true,
  sort_order integer not null default 100,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hc_homepage_stories (
  id uuid primary key default gen_random_uuid(),
  names text not null,
  location text,
  quote text,
  photo_storage_path text,
  is_active boolean not null default true,
  sort_order integer not null default 100,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.hc_homepage_showcase enable row level security;
alter table public.hc_homepage_stories enable row level security;

revoke all on table public.hc_homepage_showcase from anon, authenticated;
revoke all on table public.hc_homepage_stories from anon, authenticated;
grant select, insert, update, delete on table public.hc_homepage_showcase to service_role;
grant select, insert, update, delete on table public.hc_homepage_stories to service_role;

insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values (
  'homepage-showcase',
  'homepage-showcase',
  true,
  5000000,
  array['image/jpeg','image/png','image/webp']::text[]
)
on conflict (id) do update
set public=true,
    file_size_limit=excluded.file_size_limit,
    allowed_mime_types=excluded.allowed_mime_types;

insert into public.hc_homepage_showcase
  (name,age,city,country,relationship_intention,tagline,is_active,sort_order)
select *
from (values
  ('Amara',29,'Lagos','Nigeria','Serious Relationship','Warm conversations, shared purpose and a life built together.',true,10),
  ('Kenji',31,'Tokyo','Japan','Long-term Dating','Curious, grounded and looking for something meaningful.',true,20),
  ('Sofia',28,'Madrid','Spain','Marriage','Family-minded, adventurous and ready for a genuine connection.',true,30),
  ('Rohan',32,'Mumbai','India','Serious Relationship','Ambitious, thoughtful and hoping to meet a true partner.',true,40)
) as seed(name,age,city,country,relationship_intention,tagline,is_active,sort_order)
where not exists (select 1 from public.hc_homepage_showcase);

insert into public.hc_homepage_stories
  (names,location,quote,is_active,sort_order)
select *
from (values
  ('Rohan & Priya','Mumbai, India','We started with one thoughtful conversation and kept choosing each other.',true,10),
  ('Elena & Marco','Europe','Heart Connect gave us enough context to start with intention instead of guessing.',true,20)
) as seed(names,location,quote,is_active,sort_order)
where not exists (select 1 from public.hc_homepage_stories);

create index if not exists hc_homepage_showcase_active_sort_idx
  on public.hc_homepage_showcase (is_active, sort_order, updated_at desc);

create index if not exists hc_homepage_stories_active_sort_idx
  on public.hc_homepage_stories (is_active, sort_order, updated_at desc);
