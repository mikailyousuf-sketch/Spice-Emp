create type public.cart_status as enum ('active', 'converted', 'abandoned');
create type public.order_status as enum ('pending', 'confirmed', 'processing', 'shipped', 'completed', 'cancelled', 'refunded');
create type public.payment_status as enum ('unpaid', 'pending', 'paid', 'failed', 'refunded');
create type public.fulfilment_status as enum ('unfulfilled', 'processing', 'fulfilled', 'cancelled');

create table public.carts (
  id uuid primary key default gen_random_uuid(),
  cart_token uuid not null unique default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  status public.cart_status not null default 'active',
  currency text not null default 'ZAR' check (currency = 'ZAR'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '30 days')
);

create table public.cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references public.carts(id) on delete cascade,
  variant_id uuid not null references public.product_variants(id) on delete cascade,
  quantity numeric(12,3) not null default 1 check (quantity > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (cart_id, variant_id)
);

create table public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  label text,
  first_name text not null,
  last_name text not null,
  company text,
  phone text not null,
  line1 text not null,
  line2 text,
  suburb text,
  city text not null,
  province text not null,
  postal_code text not null,
  country_code text not null default 'ZA',
  is_default_shipping boolean not null default false,
  is_default_billing boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  user_id uuid references auth.users(id) on delete set null,
  source_cart_id uuid references public.carts(id) on delete set null,
  email text not null,
  phone text not null,
  status public.order_status not null default 'pending',
  payment_status public.payment_status not null default 'unpaid',
  fulfilment_status public.fulfilment_status not null default 'unfulfilled',
  currency text not null default 'ZAR' check (currency = 'ZAR'),
  subtotal_cents integer not null check (subtotal_cents >= 0),
  discount_cents integer not null default 0 check (discount_cents >= 0),
  shipping_cents integer not null default 0 check (shipping_cents >= 0),
  tax_cents integer not null default 0 check (tax_cents >= 0),
  total_cents integer not null check (total_cents >= 0),
  shipping_address jsonb not null,
  billing_address jsonb not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  variant_id uuid references public.product_variants(id) on delete set null,
  product_name_snapshot text not null,
  variant_name_snapshot text not null,
  sku_snapshot text not null,
  quantity numeric(12,3) not null check (quantity > 0),
  unit_price_cents integer not null check (unit_price_cents >= 0),
  total_price_cents integer not null check (total_price_cents >= 0),
  created_at timestamptz not null default now()
);

create index carts_token_idx on public.carts(cart_token);
create index carts_user_idx on public.carts(user_id) where user_id is not null;
create index cart_items_cart_idx on public.cart_items(cart_id);
create index orders_user_idx on public.orders(user_id) where user_id is not null;
create index orders_created_idx on public.orders(created_at desc);
create index order_items_order_idx on public.order_items(order_id);

alter table public.carts enable row level security;
alter table public.cart_items enable row level security;
alter table public.addresses enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

create policy "users can manage own addresses"
on public.addresses for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "users can read own orders"
on public.orders for select
to authenticated
using (auth.uid() = user_id);

create policy "users can read own order items"
on public.order_items for select
to authenticated
using (
  exists (
    select 1 from public.orders o
    where o.id = order_id and o.user_id = auth.uid()
  )
);

create policy "admins can manage orders"
on public.orders for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "admins can manage order items"
on public.order_items for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "admins can read carts"
on public.carts for select
to authenticated
using (public.is_admin());

create policy "admins can read cart items"
on public.cart_items for select
to authenticated
using (public.is_admin());
