# CivicLens

Fresh React/Vite rebuild for transparent neighborhood issue reporting.

## Run locally

```powershell
npm install
npm run dev
```

The browser uses only `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`. The secret key is server-only and is intentionally not read by the frontend.

## Supabase setup

1. Run [`supabase/schema.sql`](./supabase/schema.sql) in the Supabase SQL Editor. This creates profiles, reports, RLS policies, the `issue-photos` storage bucket, and photo policies.
2. Enable Email auth in Supabase Authentication.
3. Create the admin and normal user accounts in Authentication → Users, then set the admin profile role:

```sql
update public.profiles set role = 'admin' where id = '<admin-auth-user-uuid>';
```

Or add `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `USER_EMAIL`, and `USER_PASSWORD` to your local `.env` and run `npm run provision-users`. The script uses the server-only secret key, confirms both accounts, and assigns the correct profile roles. Use strong, unique passwords; credentials are not stored in the repository.

## Environment

`.env` is configured locally from the supplied project values and ignored by Git. Use `.env.example` as the safe template for another machine. If the supplied secret has been shared outside the intended project, rotate it in Supabase.
