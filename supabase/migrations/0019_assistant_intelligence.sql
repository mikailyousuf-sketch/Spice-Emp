alter table public.assistant_queries
add column if not exists result_count integer not null default 0,
add column if not exists strong_match boolean not null default false,
add column if not exists top_product_ids uuid[] not null default '{}',
add column if not exists refinement_context jsonb not null default '{}'::jsonb;

create index if not exists assistant_queries_match_idx
on public.assistant_queries(strong_match, created_at desc);
