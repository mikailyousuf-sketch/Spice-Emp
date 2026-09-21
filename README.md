# Spice Emp

Production-oriented foundation for a South African spice discovery and commerce platform.

## Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- Supabase/PostgreSQL
- Supabase Auth/SSR

## Local setup

1. Install Node.js 22 or newer.
2. Run `npm install`.
3. Copy `.env.example` to `.env.local`.
4. Add your Supabase project URL and publishable key.
5. Run `npm run dev`.

## Database

The first migration is in `supabase/migrations/0001_core.sql`.

Apply it through the Supabase CLI or SQL editor before using catalogue/auth features.

## Security

Never commit `.env.local`, service role keys, database passwords, or AI/payment secrets.
