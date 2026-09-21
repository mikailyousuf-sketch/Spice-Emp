alter table public.orders
add column order_access_token uuid not null default gen_random_uuid();

create unique index orders_access_token_idx
on public.orders(order_access_token);
