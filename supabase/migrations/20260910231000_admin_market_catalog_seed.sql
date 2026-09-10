-- Heart Connect initial market catalog.
-- Seeded conservatively: every market starts closed (coming_soon) with
-- registration, discovery and payments disabled. Admin must explicitly review
-- legal readiness and enable rollout controls before a market is opened.

insert into public.hc_admin_markets (
  code,country,currency,status,registration_enabled,discovery_enabled,payments_enabled,
  default_language,timezone,distance_unit,legal_review_status,support_route
)
values
  ('KE','Kenya','KES','coming_soon',false,false,false,'English','Africa/Nairobi','km','pending','/help'),
  ('US','United States','USD','coming_soon',false,false,false,'English','America/New_York','mi','pending','/help'),
  ('GB','United Kingdom','GBP','coming_soon',false,false,false,'English','Europe/London','mi','pending','/help'),
  ('CA','Canada','CAD','coming_soon',false,false,false,'English','America/Toronto','km','pending','/help'),
  ('AU','Australia','AUD','coming_soon',false,false,false,'English','Australia/Sydney','km','pending','/help'),
  ('DE','Germany','EUR','coming_soon',false,false,false,'German','Europe/Berlin','km','pending','/help'),
  ('FR','France','EUR','coming_soon',false,false,false,'French','Europe/Paris','km','pending','/help'),
  ('ES','Spain','EUR','coming_soon',false,false,false,'Spanish','Europe/Madrid','km','pending','/help'),
  ('PT','Portugal','EUR','coming_soon',false,false,false,'Portuguese','Europe/Lisbon','km','pending','/help')
on conflict (code) do nothing;

insert into public.hc_admin_readiness_checks(key,category,label,description,required,status)
values (
  'market_catalog_seeded',
  'configuration',
  'Initial market catalog seeded',
  'The native market-control catalog has at least the initial supported countries. Each market remains individually gated by rollout, legal and payment controls.',
  true,
  'passed'
)
on conflict(key) do update set
  label=excluded.label,
  description=excluded.description,
  required=excluded.required,
  status='passed',
  checked_at=now();
