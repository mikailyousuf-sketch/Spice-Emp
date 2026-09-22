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
- Payment-provider abstraction
- Yoco checkout adapter and server-side verification
- Paystack checkout adapter, callback verification and webhook signature verification
- Payment attempt records linked to orders
- Payment success/failure/pending routes
- Automatic order/payment-state updates after verification
- Configurable shipping/collection methods, fees and free-shipping thresholds

## Local setup

1. Install Node.js 22 or newer.
2. Run `npm install`.
3. Copy `.env.example` to `.env.local`.
4. Add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_SITE_URL`
5. For payments, add one or both test secret keys:
   - `YOCO_SECRET_KEY`
   - `PAYSTACK_SECRET_KEY`
6. `PAYMENT_PROVIDER=yoco` is the default provider setting, but customers can currently choose Yoco or Paystack at checkout.
7. Run `npm run dev`.

Never expose payment secret keys or the Supabase service-role key to client-side code.

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
9. `supabase/migrations/0009_payments.sql`
10. `supabase/migrations/0010_shipping.sql`
11. `supabase/migrations/0011_shipping_providers.sql`
12. `supabase/migrations/0012_product_visual_renders.sql`

Do not skip migration 0002. It creates profile/user-role automation and the admin write policies.
Migration 0004 creates the public product-image Storage bucket and admin-only write policies.
Migration 0005 adds search/filter indexes for names, aliases and discovery relationships.
Migration 0009 adds payment-attempt tracking for Yoco and Paystack.
Migration 0010 adds configurable shipping methods and order shipping snapshots.
Migration 0011 adds Courier Guy/PUDO shipping-provider support, shipment records and parcel dimensions on variants.
Migration 0012 adds dedicated catalogue-jar and featured-hero render paths for premium generated product artwork.

## Courier Guy / PUDO

The shipping layer supports Courier Guy door delivery and PUDO locker delivery through provider adapters. Configure the provider API keys and the Spice Emp collection/origin address in `.env.local`.

Product variants require shipping weight, length, width and height before live courier rates can be requested.

The server endpoints are:

- `GET /api/shipping/lockers` for PUDO locker data
- `POST /api/shipping/quotes` for live courier quotes based on the active cart

## Payment testing

### Yoco

Add the Yoco test secret key to `.env.local`:

```env
YOCO_SECRET_KEY=
```

Use Yoco test credentials/cards from the Yoco Portal when validating the hosted checkout flow.

### Paystack

Add the Paystack test secret key:

```env
PAYSTACK_SECRET_KEY=
```

Configure the Paystack webhook URL to:

```text
https://YOUR_PUBLIC_DOMAIN/api/payments/paystack/webhook
```

For local webhook testing, use a publicly reachable development URL rather than `localhost`.

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

## Premium product renders

Each product can now have:

- a catalogue jar render for shop cards and collection shelves
- an optional hero render for homepage/editorial placements
- normal product gallery images separately

Upload generated jar artwork from the product edit screen. The public storefront automatically prefers the premium render and falls back to the normal gallery image when no render is available.

## Product workflow

Admin users can currently:

- view product/variant totals
- list products
- create and edit products
- manage multiple variants
- manage stock and low-stock thresholds
- manage aliases, taxonomy and product media
- manage orders and statuses
- configure shipping and collection methods

The public `/shop` page reads active catalogue data from Supabase and supports multidimensional filtering and alias-aware search.

## Security

Never commit `.env.local`, the Supabase service role key, database password, AI keys or payment secrets.
