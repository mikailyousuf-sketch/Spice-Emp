create or replace function public.decrement_variant_stock(
  target_variant_id uuid,
  requested_quantity numeric
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  affected_count integer;
begin
  if requested_quantity <= 0 then
    return false;
  end if;

  update public.product_variants
  set
    stock_quantity = stock_quantity - requested_quantity,
    updated_at = now()
  where id = target_variant_id
    and is_active = true
    and stock_quantity >= requested_quantity;

  get diagnostics affected_count = row_count;
  return affected_count = 1;
end;
$$;

create or replace function public.increment_variant_stock(
  target_variant_id uuid,
  restore_quantity numeric
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if restore_quantity <= 0 then
    return;
  end if;

  update public.product_variants
  set
    stock_quantity = stock_quantity + restore_quantity,
    updated_at = now()
  where id = target_variant_id;
end;
$$;

revoke all on function public.decrement_variant_stock(uuid, numeric) from public, anon, authenticated;
revoke all on function public.increment_variant_stock(uuid, numeric) from public, anon, authenticated;

grant execute on function public.decrement_variant_stock(uuid, numeric) to service_role;
grant execute on function public.increment_variant_stock(uuid, numeric) to service_role;
