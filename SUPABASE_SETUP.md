# BookStore Supabase setup

The account UI uses Supabase Auth for real email/password authentication.
BookStore does not store passwords. Sessions are held in HttpOnly cookies.
Signed-in favorites are stored in a Postgres table protected by Row Level Security.

## Required setup

1. Create a free project at https://supabase.com/dashboard.
2. In Project Settings -> API / Connect, copy the Project URL and publishable key (sb_publishable_...). A legacy anon key is also accepted. Never put a service-role or secret key in a NEXT_PUBLIC_ variable.
3. In Vercel -> Project Settings -> Environment Variables, add:
   - NEXT_PUBLIC_SUPABASE_URL = https://YOUR_PROJECT_REF.supabase.co
   - NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = your publishable key
   Apply to Production (and Preview if required).
4. In Supabase -> SQL Editor, run all of supabase/book_favorites.sql.
5. In Supabase -> Authentication -> URL Configuration:
   - Site URL: https://bookstore-ux-lab.vercel.app
   - Add preview domains to Redirect URLs if needed.
6. In Authentication -> Providers -> Email, ensure Email is enabled. If email confirmation is enabled, users must verify their email before signing in.
7. Redeploy the Vercel project after setting environment variables.

## Features

- Guest favorites are kept in the current browser.
- On sign-in, guest favorites are merged into the user's private account list.
- Signed-in favorites persist across sessions/devices.
- RLS restricts each user to their own favorites.
- Passwords are handled by Supabase Auth, not stored by BookStore.
- Session access/refresh tokens are HttpOnly cookies; production cookies are Secure and SameSite=Lax.

## Smoke test

1. Register a test email and verify it if email confirmation is enabled.
2. Sign in and favorite a book.
3. Reload and confirm the heart and favorites list remain.
4. Sign out and sign in again.
5. Use a second test account to confirm it cannot see the first account's favorites.
