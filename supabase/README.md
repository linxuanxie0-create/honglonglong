# Supabase database setup

This project uses the Supabase project `znbycwnxtcnuyngokpar`.

## Create the tables

Open the project's SQL Editor and run the migration in `migrations/20261002090000_create_business_tables.sql`. It creates:

- `daily_records`: one free-text store journal entry per day and Supabase user.
- `sales`: dated motorcycle, helmet, accessory, modification, and other sales. Refunds are negative amounts; motorcycles store a model only.
- `customer_needs`: a date and the two free-text fields for purchase reason and possible future needs.

Row Level Security is enabled on every table. Policies permit authenticated users, including anonymous sessions, to read and change rows where `user_id` matches their own Supabase user ID. The migration adds no example customer records.

## Configure the local app

In Supabase, open **Project Settings → API Keys** and copy the public `anon` key (or publishable key if the project only offers the newer key format). Put it in `.env.local` as `VITE_SUPABASE_ANON_KEY`. The project URL is already set there. Restart `npm run dev` after saving the file.

Never put a `service_role` or secret key in a `VITE_` variable or browser code.

The app creates an anonymous Supabase session automatically; the owner does not enter an email or password. Enable **Authentication → Sign In / Providers → Allow anonymous sign-ins** in the Supabase dashboard. Anonymous sessions use the `authenticated` database role, so the `user_id = auth.uid()` policies continue to isolate each browser's records.

Anonymous sessions are stored in the current browser profile. Clearing browser storage or switching browsers/devices loses access to that anonymous account and its cloud records. Never put a `service_role` or secret key in a `VITE_` variable or browser code.
