# BookStore password reset setup

Password recovery uses the existing Supabase Auth project. No Resend account, new API key, database migration, or service-role key is required.

## Allow the reset URL in Supabase

1. Open the BookStore project in Supabase.
2. Go to **Authentication → URL Configuration**.
3. Under **Redirect URLs**, add the exact production URL:

   `https://bookstore-ux-lab.vercel.app/reset-password`

4. If you test locally, also add:

   `http://localhost:3000/reset-password`

5. Save the settings. Keep the Supabase recovery email template using its standard confirmation URL (`{{ .ConfirmationURL }}`) so Supabase can verify the one-time recovery link and return the session token to the reset page.

The deployed app requests a recovery email with `/reset-password` as the redirect destination. When the user opens the email link, the page accepts the recovery access token, lets the user enter and confirm a new password, and updates it through Supabase Auth.

## User flow

1. On the sign-in modal, choose **Забыли пароль?**
2. Enter the account email and submit.
3. Open the email from Supabase and follow its recovery link.
4. Enter a new password (at least 8 characters) twice.
5. Return to the store and sign in with the new password.

Supabase may rate-limit recovery emails. The UI intentionally uses a generic confirmation message so it does not reveal whether an email address has an account.
