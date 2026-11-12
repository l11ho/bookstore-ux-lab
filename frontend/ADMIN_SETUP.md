# BookStore Admin setup

This adds a protected Admin role and an initial order-management dashboard.

## 1. Apply the migration

1. Open the BookStore project in Supabase.
2. Go to **SQL Editor** and choose **New query**.
3. Copy and run the complete file:
   \`supabase/migrations/202611130001_create_bookstore_admins.sql\`

The migration creates a private admin-role table and server-checked functions. Normal signed-in users cannot read or change the role table and cannot grant themselves Admin access.

## 2. Grant Admin to the intended account

After the account has been created in **Authentication → Users**, run this separate one-time statement in SQL Editor, replacing the UUID with that account's Auth User ID:

\`\`\`sql
insert into public.bookstore_admins (user_id)
values ('PASTE_THE_ADMIN_AUTH_USER_ID_HERE')
on conflict (user_id) do nothing;
\`\`\`

Do not put this UUID in browser code, public environment variables, or a client-side form. Only a trusted project owner should run this statement.

## 3. Deploy

Merge the preview branch into \`main\` after reviewing it in Vercel. No new Vercel environment variable or service-role key is required.

## 4. Use the dashboard

Sign in to BookStore with the Admin account. The sign-in flow will show the Admin link and send that account to \`/admin\`. The dashboard currently provides demo-order totals, unique customer count, the latest 100 orders, and order-status management.

Revenue is labelled as demo revenue because the checkout does not process real payments. The first release does not provide customer account editing or book-catalog CRUD yet.

## 5. Security notes

- Admin authorization is checked by Supabase RPC using the signed-in user's access token.
- The admin table has RLS enabled and no client table permissions.
- Admin-only RPCs check the role again inside the database before returning data or changing an order.
- Never expose a Supabase service-role key in the browser.
