-- Supabase can have explicit per-role default grants in addition to PUBLIC grants.
-- Remove every inherited/default API grant before allowing the authenticated role.
revoke all on function public.is_labfis_staff() from public, anon, authenticated;
revoke all on function public.get_internal_found_object(uuid) from public, anon, authenticated;
revoke all on function public.register_found_object(uuid,text,text,text,date,text,text) from public, anon, authenticated;
grant execute on function public.is_labfis_staff() to authenticated;
grant execute on function public.get_internal_found_object(uuid) to authenticated;
grant execute on function public.register_found_object(uuid,text,text,text,date,text,text) to authenticated;

do $$ begin
  if to_regprocedure('public.rls_auto_enable()') is not null then
    revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
  end if;
end $$;
