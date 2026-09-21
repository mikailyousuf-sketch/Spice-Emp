alter table public.product_variants
add column shipping_weight_kg numeric(10,3),
add column length_cm numeric(10,2),
add column width_cm numeric(10,2),
add column height_cm numeric(10,2);

alter table public.product_variants
add constraint product_variants_shipping_weight_check
check (shipping_weight_kg is null or shipping_weight_kg > 0),
add constraint product_variants_length_check
check (length_cm is null or length_cm > 0),
add constraint product_variants_width_check
check (width_cm is null or width_cm > 0),
add constraint product_variants_height_check
check (height_cm is null or height_cm > 0);

create type public.shipping_provider as enum ('courier_guy', 'pudo');
create type public.shipment_status as enum (
  'draft',
  'submitted',
  'in_transit',
  'ready_for_collection',
  'delivered',
  'cancelled',
  'failed'
);

create table public.shipments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  provider public.shipping_provider not null,
  status public.shipment_status not null default 'draft',
  service_level_code text,
  provider_shipment_id text,
  tracking_reference text,
  label_url text,
  delivery_locker_code text,
  delivery_locker_name text,
  quoted_rate_cents integer check (quoted_rate_cents is null or quoted_rate_cents >= 0),
  provider_payload jsonb,
  provider_response jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index shipments_order_idx on public.shipments(order_id);
create index shipments_tracking_idx on public.shipments(tracking_reference)
where tracking_reference is not null;

alter table public.shipments enable row level security;

create policy "users can read own shipments"
on public.shipments for select
to authenticated
using (
  exists (
    select 1
    from public.orders o
    where o.id = order_id
      and o.user_id = auth.uid()
  )
);

create policy "admins can manage shipments"
on public.shipments for all
to authenticated
using (public.is_admin())
with check (public.is_admin());
