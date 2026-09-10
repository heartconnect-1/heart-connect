-- Heart Connect native payment ledger foundation.
-- Additive, server-only and intentionally empty on creation.
-- This creates the authoritative native Admin ledger surface without copying or
-- inventing legacy payment results. Provider/backend reconciliation remains a
-- separate verified ingestion step.

create table if not exists public.hc_payment_transactions (
  id text primary key check (char_length(id) between 1 and 180),
  user_id uuid references auth.users(id) on delete set null,
  profile_id uuid references public.dating_profiles(user_id) on delete set null,
  customer_id text,
  booking_id text,
  legacy_attempt_id text,
  provider text not null check (char_length(provider) between 1 and 80),
  kind text not null default 'payment' check (char_length(kind) between 1 and 80),
  status text not null default 'pending' check (status in (
    'initiated','pending','processing','paid','succeeded','success','completed',
    'failed','declined','cancelled','canceled','refunded','partially_refunded','reversed'
  )),
  amount_minor bigint not null check (amount_minor >= 0),
  currency text not null check (currency ~ '^[A-Z]{3}$'),
  reference text,
  transaction_reference text,
  provider_reference text,
  external_id text,
  source text not null default 'native' check (source in ('native','provider_webhook','verified_reconciliation')),
  environment text not null default 'production' check (environment in ('production','sandbox','test')),
  provider_verified_at timestamptz,
  paid_at timestamptz,
  failed_at timestamptz,
  refunded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists hc_payment_transactions_created_idx
  on public.hc_payment_transactions (created_at desc);
create index if not exists hc_payment_transactions_status_idx
  on public.hc_payment_transactions (status, created_at desc);
create index if not exists hc_payment_transactions_provider_idx
  on public.hc_payment_transactions (provider, created_at desc);
create index if not exists hc_payment_transactions_user_idx
  on public.hc_payment_transactions (user_id, created_at desc);
create index if not exists hc_payment_transactions_booking_idx
  on public.hc_payment_transactions (booking_id, created_at desc)
  where booking_id is not null;
create unique index if not exists hc_payment_transactions_provider_ref_uidx
  on public.hc_payment_transactions (provider, provider_reference)
  where provider_reference is not null and provider_reference <> '';
create unique index if not exists hc_payment_transactions_legacy_attempt_uidx
  on public.hc_payment_transactions (legacy_attempt_id)
  where legacy_attempt_id is not null and legacy_attempt_id <> '';

alter table public.hc_payment_transactions enable row level security;
revoke all on public.hc_payment_transactions from anon, authenticated;
grant all on public.hc_payment_transactions to service_role;

comment on table public.hc_payment_transactions is
  'Server-only Heart Connect native payment ledger. Rows must come from native payment processing, verified provider webhooks, or an explicitly verified reconciliation path; never from manual Admin status fabrication.';
comment on column public.hc_payment_transactions.amount_minor is
  'Amount in the currency minor unit, for example cents; KES values are stored as amount*100.';
comment on column public.hc_payment_transactions.source is
  'How this ledger row was established. verified_reconciliation requires an independently verified source rather than a manual Admin claim.';
comment on column public.hc_payment_transactions.provider_verified_at is
  'Timestamp when the payment provider or trusted verification path confirmed the recorded state.';

insert into public.hc_admin_readiness_checks(key,category,label,description,required,status)
values (
  'native_payment_ledger_present',
  'payments',
  'Native payment ledger present',
  'The server-only hc_payment_transactions ledger exists. This does not by itself prove a live payment provider or legacy reconciliation path is connected.',
  true,
  'passed'
)
on conflict(key) do update set
  label=excluded.label,
  description=excluded.description,
  required=excluded.required,
  status='passed',
  checked_at=now();
