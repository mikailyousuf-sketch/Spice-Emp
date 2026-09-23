alter table public.orders
add column if not exists tracking_reference text,
add column if not exists admin_notes text,
add column if not exists dispatched_at timestamptz;

create index if not exists orders_fulfilment_created_idx
on public.orders (fulfilment_status, created_at desc);
