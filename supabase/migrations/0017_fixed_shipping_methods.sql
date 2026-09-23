-- Replace live courier quoting with store-controlled shipping options.

alter table public.shipping_methods
add column if not exists availability_mode text not null default 'always'
  check (availability_mode in ('always','uber_radius'));

create table if not exists public.shipping_settings (
  id boolean primary key default true check (id = true),
  uber_online boolean not null default false,
  uber_origin_label text,
  uber_origin_lat numeric(10,7),
  uber_origin_lng numeric(10,7),
  uber_radius_km numeric(8,2) not null default 15 check (uber_radius_km > 0 and uber_radius_km <= 100),
  uber_fee_cents integer not null default 10000 check (uber_fee_cents >= 0 and uber_fee_cents <= 10000),
  updated_at timestamptz not null default now()
);

insert into public.shipping_settings (id)
values (true)
on conflict (id) do nothing;

alter table public.shipping_settings enable row level security;

drop policy if exists "public can read shipping settings" on public.shipping_settings;
create policy "public can read shipping settings"
on public.shipping_settings for select
using (true);

drop policy if exists "admins manage shipping settings" on public.shipping_settings;
create policy "admins manage shipping settings"
on public.shipping_settings for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

insert into public.shipping_methods (
  name, code, description, fee_cents, free_above_cents, is_collection, is_active, sort_order, availability_mode
)
values
  ('Door to door', 'door-to-door', '3–5 working days · Shipped with The Courier Guy', 12000, null, false, true, 10, 'always'),
  ('PUDO locker pickup', 'pudo-locker', 'Locker pickup', 7500, null, false, true, 20, 'always'),
  ('Uber delivery', 'uber-delivery', 'Same-day local delivery when available', 10000, null, false, true, 30, 'uber_radius')
on conflict (code) do update set
  name = excluded.name,
  description = excluded.description,
  fee_cents = excluded.fee_cents,
  free_above_cents = excluded.free_above_cents,
  is_collection = excluded.is_collection,
  is_active = excluded.is_active,
  sort_order = excluded.sort_order,
  availability_mode = excluded.availability_mode,
  updated_at = now();

update public.shipping_methods
set is_active = false, updated_at = now()
where code not in ('door-to-door','pudo-locker','uber-delivery')
  and is_collection = false;
