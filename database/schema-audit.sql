-- NEXORA live-schema audit — READ ONLY.
-- Run in Supabase SQL Editor before preparing any migration.
-- This file contains SELECT statements only. It does not create, alter, truncate or delete data.

-- 1) Current public tables.
select table_name
from information_schema.tables
where table_schema = 'public'
  and table_type = 'BASE TABLE'
order by table_name;

-- 2) Columns of all tables referenced by the currently inspected NEXORA source.
select table_name, ordinal_position, column_name, data_type, is_nullable, column_default
from information_schema.columns
where table_schema = 'public'
  and table_name in (
    'profiles',
    'user_data',
    'nexora_user_data',
    'backup_preferences',
    'nexora_posts',
    'nexora_follows',
    'nexora_follow_requests',
    'nexora_notifications',
    'nexora_likes',
    'nexora_reviews',
    'nexora_daily_champions'
  )
order by table_name, ordinal_position;

-- 3) Row Level Security status for public tables.
select n.nspname as schema_name,
       c.relname as table_name,
       c.relrowsecurity as rls_enabled,
       c.relforcerowsecurity as rls_forced
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind = 'r'
order by c.relname;

-- 4) Existing policies. Review SELECT/INSERT/UPDATE/DELETE separately.
select schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
from pg_policies
where schemaname = 'public'
order by tablename, policyname;

-- 5) RPC functions currently referenced by NEXORA source.
select n.nspname as schema_name,
       p.proname as function_name,
       pg_get_function_identity_arguments(p.oid) as arguments,
       pg_get_function_result(p.oid) as result_type
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in (
    'nexora_is_admin',
    'nexora_set_username',
    'nexora_leaderboard',
    'nexora_follow_user',
    'nexora_unfollow_user',
    'nexora_accept_follow_request',
    'nexora_reject_follow_request'
  )
order by p.proname, arguments;

-- 6) Existing indexes on application tables.
select schemaname, tablename, indexname, indexdef
from pg_indexes
where schemaname = 'public'
  and tablename in (
    'profiles',
    'nexora_user_data',
    'backup_preferences',
    'nexora_posts',
    'nexora_follows',
    'nexora_follow_requests',
    'nexora_notifications',
    'nexora_likes',
    'nexora_reviews',
    'nexora_daily_champions'
  )
order by tablename, indexname;
