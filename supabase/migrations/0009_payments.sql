create type public.payment_provider as enum ('yoco', 'paystack');
create type public.payment_attempt_status as enum ('created', 'pending', 'succeeded', 'failed', 'cancelled', 'refunded');

create table public.payment_attempts (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  provider public.payment_provider not null,
  status public.payment_attempt_status not null default 'created',
  provider_reference text,
  provider_checkout_id text,
  amount_cents integer not null check (amount_cents >= 0),
  currency text not null default 'ZAR',
  checkout_url text,
  raw_response jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index payment_attempts_order_idx on public.payment_attempts(order_id);
create unique index payment_attempt_provider_ref_idx
on public.payment_attempts(provider, provider_reference)
where provider_reference is not null;

alter table public.payment_attempts enable row level security;

create policy "users can read own payment attempts"
on public.payment_attempts for select
to authenticated
using (
  exists (
    select 1 from public.orders o
    where o.id = order_id and o.user_id = auth.uid()
  )
);

create policy "admins can manage payment attempts"
on public.payment_attempts for all
to authenticated
using (public.is_admin())
with check (public.is_admin());
