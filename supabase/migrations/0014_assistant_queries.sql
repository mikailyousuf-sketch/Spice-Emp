create table if not exists public.assistant_queries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  query_text text not null check (char_length(query_text) between 2 and 1000),
  created_at timestamptz not null default now()
);

alter table public.assistant_queries enable row level security;

create policy "users can insert own assistant queries"
on public.assistant_queries for insert
to authenticated
with check (auth.uid() = user_id);

create policy "admins can read assistant queries"
on public.assistant_queries for select
to authenticated
using (public.is_admin());

create index if not exists assistant_queries_created_at_idx
on public.assistant_queries(created_at desc);
