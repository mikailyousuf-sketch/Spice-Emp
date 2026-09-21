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
- Cuisine, food, flavour, method and heat filters
- Alias-aware search
- Product images via Supabase Storage
- Editable variants, inventory and low-stock thresholds
- GitHub CI type/build checks

## Phase 2 commerce

The current commerce layer includes:

- Guest cart stored with a secure HTTP-only cart token
- Add/update/remove cart items
- Live stock validation
- Checkout delivery form
- Pending order creation with immutable price/SKU/product snapshots
- Atomic stock reservation to reduce overselling risk
- Guest order confirmation via separate order access token
- Signed-in customer order history and detail pages
- Admin order list, detail and manual status management

Payment-provider integration is the next commerce step.

## Local setup

1. Install Node.js 22 or newer.
2. Run `npm install`.
3. Copy `.env.example` to `.env.local`.
4. Add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
5. Add `SUPABASE_SERVICE_ROLE_KEY` to `.env.local` for secure server-side guest carts and checkout. Never expose this key to browser code.
6. Run `npm run dev`.

## Apply Supabase migrations

Run the SQL files in order using the Supabase SQL editor, or link the Supabase CLI and run migrations:

1. `supabase/migrations/0001_core.sql`
2. `supabase/migrations/0002_security_and_catalogue.sql`
3. `supabase/migrations/0003_seed_taxonomy.sql`
4. `supabase/migrations/0004_product_media.sql`
5. `supabase/migrations/0005_search_indexes.sql`
6. `supabase/migrations/0006_commerce_core.sql`
7. `supabase/migrations/0007_order_access_tokens.sql`
8. `supabase/migrations/0008_atomic_stock.sql`

Do not skip migration 0002. It creates profile/user-role automation and the admin write policies.
Migration 0004 creates the public product-image Storage bucket and admin-only write policies.
Migration 0005 adds search/filter indexes for names, aliases and discovery relationships.

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
