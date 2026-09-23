alter table public.orders
add column if not exists stock_released_at timestamptz;

update public.orders
set stock_released_at = coalesce(stock_released_at, updated_at)
where status = 'cancelled'
  and payment_status <> 'paid'
  and stock_released_at is null;

create or replace function public.release_order_stock(target_order_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  order_row public.orders%rowtype;
  item record;
begin
  select *
  into order_row
  from public.orders
  where id = target_order_id
  for update;

  if not found then
    return false;
  end if;

  if order_row.payment_status = 'paid' or order_row.stock_released_at is not null then
    return false;
  end if;

  for item in
    select variant_id, quantity
    from public.order_items
    where order_id = target_order_id
      and variant_id is not null
  loop
    update public.product_variants
    set
      stock_quantity = stock_quantity + item.quantity,
      updated_at = now()
    where id = item.variant_id;
  end loop;

  update public.orders
  set
    status = 'cancelled',
    payment_status = 'failed',
    fulfilment_status = 'cancelled',
    stock_released_at = now(),
    updated_at = now()
  where id = target_order_id;

  return true;
end;
$$;

create or replace function public.confirm_paid_order(target_order_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  order_row public.orders%rowtype;
  item record;
  variant_row public.product_variants%rowtype;
begin
  select *
  into order_row
  from public.orders
  where id = target_order_id
  for update;

  if not found then
    return 'missing';
  end if;

  if order_row.payment_status = 'paid' then
    return 'already_paid';
  end if;

  if order_row.stock_released_at is not null then
    for item in
      select variant_id, quantity
      from public.order_items
      where order_id = target_order_id
        and variant_id is not null
      order by id
    loop
      select *
      into variant_row
      from public.product_variants
      where id = item.variant_id
      for update;

      if not found
        or not variant_row.is_active
        or variant_row.stock_quantity < item.quantity
      then
        update public.orders
        set
          status = 'cancelled',
          payment_status = 'paid',
          fulfilment_status = 'cancelled',
          notes = concat_ws(
            E'\n',
            nullif(notes, ''),
            'PAYMENT RECEIVED AFTER STOCK RELEASE: manual customer contact/refund required.'
          ),
          updated_at = now()
        where id = target_order_id;

        return 'paid_stock_unavailable';
      end if;
    end loop;

    for item in
      select variant_id, quantity
      from public.order_items
      where order_id = target_order_id
        and variant_id is not null
      order by id
    loop
      update public.product_variants
      set
        stock_quantity = stock_quantity - item.quantity,
        updated_at = now()
      where id = item.variant_id;
    end loop;
  end if;

  update public.orders
  set
    status = 'confirmed',
    payment_status = 'paid',
    fulfilment_status = case
      when fulfilment_status = 'cancelled' then 'unfulfilled'::public.fulfilment_status
      else fulfilment_status
    end,
    stock_released_at = null,
    updated_at = now()
  where id = target_order_id;

  return 'paid';
end;
$$;

revoke all on function public.release_order_stock(uuid) from public, anon, authenticated;
revoke all on function public.confirm_paid_order(uuid) from public, anon, authenticated;

grant execute on function public.release_order_stock(uuid) to service_role;
grant execute on function public.confirm_paid_order(uuid) to service_role;
