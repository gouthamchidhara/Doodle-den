-- Parents may create their family row but never set plan / ai_entitled (server-only via service role).
revoke insert, update on public.family from anon, authenticated;
grant insert (parent_user_id) on public.family to authenticated;
-- No anon access to family data tables.
revoke all on public.family, public.kid_profile, public.time_rule, public.usage_day, public.artwork, public.ai_consent, public.ai_usage, public.family_share, public.app_config from anon;
-- Pin search_path on the server time function.
create or replace function public.server_now() returns timestamptz
  language sql stable set search_path = '' as $$ select now() $$;
grant execute on function public.server_now() to anon, authenticated;
