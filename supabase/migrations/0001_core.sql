create extension if not exists pgcrypto;

create type public.account_type as enum ('retail', 'business');
create type public.app_role as enum ('customer', 'business_customer', 'staff', 'admin', 'super_admin');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  first_name text,
  last_name text,
  phone text,
  account_type public.account_type not null default 'retail',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_roles (
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  primary key (user_id, role)
);

create table public.product_types (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique
);

create table public.cuisines (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique
);

create table public.food_types (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique
);

create table public.flavours (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique
);

create table public.cooking_methods (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  short_description text,
  description text,
  product_type_id uuid references public.product_types(id),
  heat_level smallint not null default 0 check (heat_level between 0 and 5),
  country_of_origin text,
  is_active boolean not null default true,
  is_featured boolean not null default false,
  seo_title text,
  seo_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  sku text not null unique,
  weight_value numeric(12,3) not null check (weight_value > 0),
  weight_unit text not null check (weight_unit in ('g', 'kg')),
  retail_price_cents integer not null check (retail_price_cents >= 0),
  cost_price_cents integer check (cost_price_cents is null or cost_price_cents >= 0),
  stock_quantity numeric(14,3) not null default 0 check (stock_quantity >= 0),
  low_stock_threshold numeric(14,3) not null default 0 check (low_stock_threshold >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.product_aliases (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  alias text not null,
  unique (product_id, alias)
);

create table public.product_cuisines (
  product_id uuid not null references public.products(id) on delete cascade,
  cuisine_id uuid not null references public.cuisines(id) on delete cascade,
  primary key (product_id, cuisine_id)
);

create table public.product_food_types (
  product_id uuid not null references public.products(id) on delete cascade,
  food_type_id uuid not null references public.food_types(id) on delete cascade,
  primary key (product_id, food_type_id)
);

create table public.product_flavours (
  product_id uuid not null references public.products(id) on delete cascade,
  flavour_id uuid not null references public.flavours(id) on delete cascade,
  primary key (product_id, flavour_id)
);

create table public.product_cooking_methods (
  product_id uuid not null references public.products(id) on delete cascade,
  cooking_method_id uuid not null references public.cooking_methods(id) on delete cascade,
  primary key (product_id, cooking_method_id)
);

alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.product_aliases enable row level security;
alter table public.product_types enable row level security;
alter table public.cuisines enable row level security;
alter table public.food_types enable row level security;
alter table public.flavours enable row level security;
alter table public.cooking_methods enable row level security;
alter table public.product_cuisines enable row level security;
alter table public.product_food_types enable row level security;
alter table public.product_flavours enable row level security;
alter table public.product_cooking_methods enable row level security;

create policy "public can read active products"
on public.products for select
using (is_active = true);

create policy "public can read active product variants"
on public.product_variants for select
using (
  is_active = true
  and exists (
    select 1 from public.products p
    where p.id = product_id and p.is_active = true
  )
);

create policy "public can read product taxonomy"
on public.product_types for select using (true);
create policy "public can read cuisines"
on public.cuisines for select using (true);
create policy "public can read food types"
on public.food_types for select using (true);
create policy "public can read flavours"
on public.flavours for select using (true);
create policy "public can read cooking methods"
on public.cooking_methods for select using (true);
create policy "public can read product aliases"
on public.product_aliases for select using (true);
create policy "public can read product cuisines"
on public.product_cuisines for select using (true);
create policy "public can read product food types"
on public.product_food_types for select using (true);
create policy "public can read product flavours"
on public.product_flavours for select using (true);
create policy "public can read product cooking methods"
on public.product_cooking_methods for select using (true);

create policy "users can read own profile"
on public.profiles for select
to authenticated
using (auth.uid() = id);

create policy "users can update own profile"
on public.profiles for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);
