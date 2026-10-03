# Supabase database setup

This project uses the Supabase project `znbycwnxtcnuyngokpar`.

## Create the tables

Open the project's SQL Editor and run the migration in `migrations/20261002090000_create_business_tables.sql`. It creates:

- `daily_records`: one free-text store journal entry per day and Supabase user.
- `sales`: dated motorcycle, helmet, accessory, modification, and other sales. Refunds are negative amounts; motorcycles store a model only.
- `customer_needs`: a date and the two free-text fields for purchase reason and possible future needs.

After the base migration, run `migrations/20261003120000_add_customer_research_fields.sql` to add optional audience research fields to `customer_needs`: gender, age range, hometown province, broad residence area, store discovery source, payer, decision maker, core needs, and a short core-needs note. No name, phone number, or detailed address is collected. Existing rows remain valid and the new fields are blank until you choose to fill them in.

The app adds a **人群调研** page with month and all-record filters. Counts use each visit note as one record; one person visiting more than once can therefore appear more than once. Core needs are multi-select, so their percentages can add up to more than 100%.

Row Level Security is enabled on every table. Policies permit authenticated users, including anonymous sessions, to read and change rows where `user_id` matches their own Supabase user ID. The migration adds no example customer records.

## Configure the local app

In Supabase, open **Project Settings → API Keys** and copy the public `anon` key (or publishable key if the project only offers the newer key format). Put it in `.env.local` as `VITE_SUPABASE_ANON_KEY`. The project URL is already set there. Restart `npm run dev` after saving the file.

Never put a `service_role` or secret key in a `VITE_` variable or browser code.

The app creates an anonymous Supabase session automatically; the owner does not enter an email or password. Enable **Authentication → Sign In / Providers → Allow anonymous sign-ins** in the Supabase dashboard. Anonymous sessions use the `authenticated` database role, so the `user_id = auth.uid()` policies continue to isolate each browser's records.

Anonymous sessions are stored in the current browser profile. Clearing browser storage or switching browsers/devices loses access to that anonymous account and its cloud records. Never put a `service_role` or secret key in a `VITE_` variable or browser code.
