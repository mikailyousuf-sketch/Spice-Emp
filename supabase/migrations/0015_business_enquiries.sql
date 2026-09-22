create type public.business_enquiry_status as enum (
  'new',
  'reviewing',
  'approved',
  'declined',
  'closed'
);

create table public.business_enquiries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  company_name text not null,
  registration_number text,
  vat_number text,
  business_type text not null,
  contact_name text not null,
  email text not null,
  phone text not null,
  city text not null,
  province text not null,
  monthly_volume_kg numeric(12,2) check (monthly_volume_kg is null or monthly_volume_kg >= 0),
  ordering_frequency text,
  requested_items jsonb not null default '[]'::jsonb,
  notes text,
  status public.business_enquiry_status not null default 'new',
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index business_enquiries_status_idx
on public.business_enquiries(status, created_at desc);

create index business_enquiries_user_idx
on public.business_enquiries(user_id)
where user_id is not null;

alter table public.business_enquiries enable row level security;

create policy "users can read own business enquiries"
on public.business_enquiries for select
to authenticated
using (user_id = auth.uid());

create policy "admins manage business enquiries"
on public.business_enquiries for all
to authenticated
using (public.is_admin())
with check (public.is_admin());
