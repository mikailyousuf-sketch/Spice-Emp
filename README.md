# Spice Emp

South African spice discovery and commerce platform.

## Current Phase

Phase 1 foundation is in progress and now includes:

- Next.js 16 / React 19 / TypeScript
- Tailwind CSS
- Supabase SSR authentication
- Product and variant catalogue schema
- Taxonomy schema + seed data
- RLS and admin role checks
- Auth pages
- Protected admin dashboard
- Admin product creation
- Database-backed shop/product pages
- GitHub CI type/build checks

## Local setup

1. Install Node.js 22 or newer.
2. Run `npm install`.
3. Copy `.env.example` to `.env.local`.
4. Add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
5. Run `npm run dev`.

## Apply Supabase migrations

Run the SQL files in order using the Supabase SQL editor, or link the Supabase CLI and run migrations:

1. `supabase/migrations/0001_core.sql`
2. `supabase/migrations/0002_security_and_catalogue.sql`
3. `supabase/migrations/0003_seed_taxonomy.sql`

Do not skip migration 0002. It creates profile/user-role automation and the admin write policies.

## Create the first admin

1. Create your account at `/auth/sign-up`.
2. Confirm the email if email confirmation is enabled.
3. In Supabase SQL Editor, find your auth user UUID and run:

```sql
insert into public.user_roles (user_id, role)
values ('YOUR_AUTH_USER_UUID', 'super_admin')
on conflict do nothing;
```

You can then visit `/admin`.

## Product workflow

Admin users can currently:

- view product/variant totals
- list products
- create a product
- create its first sellable variant with SKU, weight, price and stock

The public `/shop` page reads active catalogue data from Supabase and supports basic name/type filtering.

## Security

Never commit `.env.local`, the Supabase service role key, database password, AI keys or payment secrets.
