# BookStore demo checkout setup

This branch adds an international checkout demonstration. It does **not** connect to a payment processor and does **not** charge a card or PayPal account.

## 1. Apply the Supabase database migration

1. Open the Supabase project used by BookStore.
2. Open **SQL Editor** and choose **New query**.
3. Copy and run the complete contents of `supabase/migrations/202611120001_create_bookstore_demo_orders.sql`.
4. The migration creates `public.bookstore_orders`, enables Row Level Security, and adds a server-side RPC that calculates prices and shipping.

The order table is readable only by its owner. The browser cannot directly insert an order; the authenticated server route calls the database function.

## 2. Vercel environment variables

The checkout reuses the same variables as the existing Supabase sign-in flow:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

No payment-provider secret is required. Do not add a Stripe, PayPal, or Supabase service-role secret for this demo.

If these variables already work for sign-in, leave them unchanged. If you add or edit them in Vercel, redeploy the project.

## 3. Deploy

The app is in the `frontend` directory. Merge this branch into `main` after reviewing the Vercel preview. Vercel should then build and deploy the production site.

## 4. Demo behavior

- Catalog prices are interpreted as USD cents (for example, `1890` displays as `$18.90`).
- International shipping is `$7.95`, free for orders of `$75.00` or more.
- Taxes are not calculated.
- Demo Card and Demo PayPal only simulate a successful payment.
- Orders are saved against the signed-in Supabase user.
- No card number, CVV, PayPal password, or real payment credential is collected.

This is suitable for a UX/classroom demonstration only. A real store needs a payment provider, verified webhooks, tax/shipping rules, and production order-fulfillment logic.
