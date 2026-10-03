-- Extend customer demand notes with optional, anonymous research fields.
-- Existing rows keep their current content and receive empty/null survey fields.

alter table public.customer_needs
  add column if not exists gender text,
  add column if not exists age_group text,
  add column if not exists hometown_province text,
  add column if not exists residence_area text,
  add column if not exists discovery_source text,
  add column if not exists payer_role text,
  add column if not exists decision_role text,
  add column if not exists core_needs text[] not null default '{}'::text[],
  add column if not exists core_need_note text;

alter table public.customer_needs
  drop constraint if exists customer_needs_gender_valid,
  add constraint customer_needs_gender_valid check (
    gender is null or gender in ('male', 'female', 'other', 'prefer_not_to_say')
  ),
  drop constraint if exists customer_needs_age_group_valid,
  add constraint customer_needs_age_group_valid check (
    age_group is null or age_group in ('18_24', '25_34', '35_44', '45_54', '55_plus', 'prefer_not_to_say')
  ),
  drop constraint if exists customer_needs_residence_area_valid,
  add constraint customer_needs_residence_area_valid check (
    residence_area is null or residence_area in ('same_district', 'same_city_other_district', 'nearby_city', 'other_province', 'prefer_not_to_say')
  ),
  drop constraint if exists customer_needs_discovery_source_valid,
  add constraint customer_needs_discovery_source_valid check (
    discovery_source is null or discovery_source in ('douyin', 'xiaohongshu', 'map_search', 'friend', 'passerby', 'offline_event', 'other', 'unknown')
  ),
  drop constraint if exists customer_needs_payer_role_valid,
  add constraint customer_needs_payer_role_valid check (
    payer_role is null or payer_role in ('self', 'family', 'partner', 'shared', 'unknown')
  ),
  drop constraint if exists customer_needs_decision_role_valid,
  add constraint customer_needs_decision_role_valid check (
    decision_role is null or decision_role in ('self', 'family', 'partner', 'shared', 'unknown')
  ),
  drop constraint if exists customer_needs_core_needs_valid,
  add constraint customer_needs_core_needs_valid check (
    core_needs <@ array['commute', 'weekend_touring', 'sport_offroad', 'first_motorcycle', 'upgrade', 'other']::text[]
  ),
  drop constraint if exists customer_needs_has_content,
  add constraint customer_needs_has_content check (
    length(trim(purchase_reason)) > 0
    or length(trim(future_needs)) > 0
    or gender is not null
    or age_group is not null
    or hometown_province is not null
    or residence_area is not null
    or discovery_source is not null
    or payer_role is not null
    or decision_role is not null
    or cardinality(core_needs) > 0
    or length(trim(coalesce(core_need_note, ''))) > 0
  );
