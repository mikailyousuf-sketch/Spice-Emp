create table public.shipping_methods (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text not null unique,
  description text,
  fee_cents integer not null default 0 check (fee_cents >= 0),
  free_above_cents integer check (free_above_cents is null or free_above_cents >= 0),
  is_collection boolean not null default false,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index shipping_methods_active_idx
on public.shipping_methods(is_active, sort_order);

alter table public.shipping_methods enable row level security;

create policy "public can read active shipping methods"
on public.shipping_methods for select
using (is_active = true);

create policy "admins can manage shipping methods"
on public.shipping_methods for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

alter table public.orders
add column shipping_method_id uuid references public.shipping_methods(id) on delete set null,
add column shipping_method_snapshot text;

create index orders_shipping_method_idx
on public.orders(shipping_method_id);
