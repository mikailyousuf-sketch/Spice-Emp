create type public.wholesale_quote_status as enum (
  'draft',
  'sent',
  'accepted',
  'rejected',
  'expired',
  'converted'
);

create table public.wholesale_quotes (
  id uuid primary key default gen_random_uuid(),
  enquiry_id uuid not null references public.business_enquiries(id) on delete cascade,
  quote_number text not null unique,
  access_token uuid not null unique default gen_random_uuid(),
  status public.wholesale_quote_status not null default 'draft',
  currency text not null default 'ZAR' check (currency = 'ZAR'),
  subtotal_cents integer not null default 0 check (subtotal_cents >= 0),
  discount_cents integer not null default 0 check (discount_cents >= 0),
  shipping_cents integer not null default 0 check (shipping_cents >= 0),
  tax_cents integer not null default 0 check (tax_cents >= 0),
  total_cents integer not null default 0 check (total_cents >= 0),
  valid_until date,
  customer_notes text,
  admin_notes text,
  sent_at timestamptz,
  responded_at timestamptz,
  converted_order_id uuid references public.orders(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.wholesale_quote_items (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references public.wholesale_quotes(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name_snapshot text not null,
  quantity_kg numeric(12,3) not null check (quantity_kg > 0),
  unit_price_cents_per_kg integer not null check (unit_price_cents_per_kg >= 0),
  total_price_cents integer not null check (total_price_cents >= 0),
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index wholesale_quotes_enquiry_idx
on public.wholesale_quotes(enquiry_id, created_at desc);

create index wholesale_quotes_status_idx
on public.wholesale_quotes(status, created_at desc);

create index wholesale_quote_items_quote_idx
on public.wholesale_quote_items(quote_id, sort_order);

alter table public.wholesale_quotes enable row level security;
alter table public.wholesale_quote_items enable row level security;

create policy "admins manage wholesale quotes"
on public.wholesale_quotes for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "business users read own wholesale quotes"
on public.wholesale_quotes for select
to authenticated
using (
  exists (
    select 1
    from public.business_enquiries be
    where be.id = enquiry_id
      and be.user_id = auth.uid()
  )
);

create policy "admins manage wholesale quote items"
on public.wholesale_quote_items for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "business users read own wholesale quote items"
on public.wholesale_quote_items for select
to authenticated
using (
  exists (
    select 1
    from public.wholesale_quotes q
    join public.business_enquiries be on be.id = q.enquiry_id
    where q.id = quote_id
      and be.user_id = auth.uid()
  )
);

alter table public.orders
add column if not exists wholesale_quote_id uuid references public.wholesale_quotes(id) on delete set null;

create index if not exists orders_wholesale_quote_idx
on public.orders(wholesale_quote_id)
where wholesale_quote_id is not null;
