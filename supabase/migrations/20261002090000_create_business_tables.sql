-- 栖点 · 门店经营情报
-- Run this migration in the Supabase SQL Editor for project znbycwnxtcnuyngokpar.

create table if not exists public.daily_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  record_date date not null default (now() at time zone 'Asia/Shanghai')::date,
  note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint daily_records_user_date_unique unique (user_id, record_date)
);

create table if not exists public.sales (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  sale_date date not null default (now() at time zone 'Asia/Shanghai')::date,
  category text not null check (category in ('motorcycle', 'helmet', 'accessory', 'modification', 'other')),
  model text,
  item_name text,
  amount numeric(12, 2) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sales_motorcycle_model_required check (
    (category = 'motorcycle' and model is not null and length(trim(model)) > 0 and item_name is null)
    or (category <> 'motorcycle' and model is null and item_name is not null and length(trim(item_name)) > 0)
  )
);

create table if not exists public.customer_needs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  recorded_on date not null default (now() at time zone 'Asia/Shanghai')::date,
  purchase_reason text not null default '',
  future_needs text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint customer_needs_has_content check (
    length(trim(purchase_reason)) > 0 or length(trim(future_needs)) > 0
  )
);

create index if not exists daily_records_user_date_idx
  on public.daily_records (user_id, record_date desc);
create index if not exists sales_user_date_idx
  on public.sales (user_id, sale_date desc);
create index if not exists sales_user_category_date_idx
  on public.sales (user_id, category, sale_date desc)
  where amount > 0 and category <> 'motorcycle';
create index if not exists customer_needs_user_date_idx
  on public.customer_needs (user_id, recorded_on desc);

alter table public.daily_records enable row level security;
alter table public.sales enable row level security;
alter table public.customer_needs enable row level security;

drop policy if exists "Owners can manage their daily records" on public.daily_records;
create policy "Owners can manage their daily records"
  on public.daily_records for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists "Owners can manage their sales" on public.sales;
create policy "Owners can manage their sales"
  on public.sales for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists "Owners can manage their customer needs" on public.customer_needs;
create policy "Owners can manage their customer needs"
  on public.customer_needs for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

grant select, insert, update, delete on public.daily_records to authenticated;
grant select, insert, update, delete on public.sales to authenticated;
grant select, insert, update, delete on public.customer_needs to authenticated;
