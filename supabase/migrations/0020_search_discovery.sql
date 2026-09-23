create table if not exists public.product_searches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  query_text text not null check (char_length(query_text) between 1 and 160),
  result_count integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.product_searches enable row level security;

create policy "admins can read product searches"
on public.product_searches for select
to authenticated
using (public.is_admin());

create index if not exists product_searches_created_at_idx
on public.product_searches(created_at desc);

create index if not exists product_searches_query_lower_idx
on public.product_searches(lower(query_text));

create or replace function public.search_catalogue(search_term text, result_limit integer default 12)
returns table (
  product_id uuid,
  score real
)
language sql
stable
security definer
set search_path = public
as $$
  with normalized as (
    select trim(lower(coalesce(search_term, ''))) as q
  ),
  product_scores as (
    select
      p.id as product_id,
      greatest(
        similarity(lower(p.name), n.q),
        coalesce(max(similarity(lower(pa.alias), n.q)), 0)
      )
      + case
          when lower(p.name) like '%' || n.q || '%' then 0.45
          else 0
        end
      + case
          when bool_or(lower(coalesce(pa.alias, '')) like '%' || n.q || '%') then 0.35
          else 0
        end as score
    from public.products p
    cross join normalized n
    left join public.product_aliases pa on pa.product_id = p.id
    where p.is_active = true
      and char_length(n.q) > 0
    group by p.id, p.name, n.q
  )
  select product_id, score::real
  from product_scores
  where score >= 0.18
  order by score desc, product_id
  limit greatest(1, least(result_limit, 50));
$$;

grant execute on function public.search_catalogue(text, integer) to anon, authenticated;
