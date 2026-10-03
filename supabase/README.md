# Supabase database setup

This project uses the Supabase project `znbycwnxtcnuyngokpar`.

## Create the tables

Open the project's SQL Editor and run the migration in `migrations/20261002090000_create_business_tables.sql`. It creates:

- `daily_records`: one free-text store journal entry per day and signed-in user.
- `sales`: dated motorcycle, helmet, accessory, modification, and other sales. Refunds are negative amounts; motorcycles store a model only.
- `customer_needs`: a date and the two free-text fields for purchase reason and possible future needs.

Row Level Security is enabled on every table. Policies permit authenticated users to read and change rows where `user_id` matches their own Supabase user ID. The migration adds no example customer records.

## Configure the local app

In Supabase, open **Project Settings → API Keys** and copy the public `anon` key (or publishable key if the project only offers the newer key format). Put it in `.env.local` as `VITE_SUPABASE_ANON_KEY`. The project URL is already set there. Restart `npm run dev` after saving the file.

Never put a `service_role` or secret key in a `VITE_` variable or browser code.

The app's sign-in and cloud data flows are separate later build steps; these tables and policies prepare the database without exposing any records before sign-in is implemented.

The app sends a password-free sign-in link to the email address entered by the owner. In **Authentication → URL Configuration**, add the local app URL (`http://127.0.0.1:5174`) to the allowed redirect URLs so the email link can return to the local workbench.
