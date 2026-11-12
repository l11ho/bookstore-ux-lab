# BookStore Admin setup

## Existing Admin access

The protected Admin role is managed by \`supabase/migrations/202611130001_create_bookstore_admins.sql\`. The Admin account must already be present in \`public.bookstore_admins\`. Protected API requests verify the role through Supabase; do not expose a service-role key in Vercel or browser code.

## Enable the full management suite

1. Open the BookStore project in Supabase.
2. Go to **SQL Editor → New query**.
3. Copy and run the complete file \`supabase/migrations/202611140001_admin_management_suite.sql\`.
4. Wait for the Vercel preview deployment from \`feat/admin-management-suite\`.
5. Test the preview. Merge its pull request into \`main\` after review.

## Dashboard sections

- Overview: order totals, demo revenue, inventory alerts, monthly revenue and best sellers.
- Books: add, edit, search and archive books; update price, stock, categories, description, cover and homepage collections.
- Orders: search orders, inspect shipping details and line items, update order status.
- Customers: contact details from saved demo shipping addresses, lifetime demo spend and order history.
- Analytics: monthly demo revenue, order status distribution and best-selling books.

The migration seeds the existing 22 catalog books without overwriting existing rows. Archived books are hidden from the storefront but remain in the database for historic order references. Checkout reads current prices from Supabase and decrements stock for in-stock books. Preorders do not decrement stock.

## Important

Checkout remains demo-only. No card or PayPal charge is made. Customer details in Admin are derived from order shipping information; the dashboard does not expose or edit Supabase Auth passwords or credentials.
