-- SiteCost SaaS authorization hardening.
-- Keep privileged authorization logic out of the exposed public API schema.
-- Public helper names remain as SECURITY INVOKER compatibility wrappers because
-- existing RLS policies and legacy database functions already call them.

create schema if not exists private;

revoke all on schema private from public;
grant usage on schema private to authenticated, service_role;

-- Platform administrator only. Organization owners/admins are intentionally not
-- treated as global app admins so a future multi-tenant customer cannot cross
-- organization boundaries through legacy admin-all policies.
create or replace function private.is_app_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.core_profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  );
$$;

-- Project access is granted by one of three paths:
-- 1) platform admin,
-- 2) explicit project membership,
-- 3) active organization owner/executive/admin membership for the project's org.
create or replace function private.has_project_access(p_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.is_app_admin()
      or exists (
        select 1
        from public.core_project_members m
        where m.project_id = p_project_id
          and m.user_id = auth.uid()
      )
      or exists (
        select 1
        from public.core_projects p
        join public.core_organization_members om
          on om.organization_id = p.organization_id
        where p.id = p_project_id
          and om.user_id = auth.uid()
          and om.is_active
          and om.member_role in ('owner','executive','admin')
      );
$$;

revoke all on function private.is_app_admin() from public;
revoke all on function private.has_project_access(uuid) from public;
grant execute on function private.is_app_admin() to authenticated, service_role;
grant execute on function private.has_project_access(uuid) to authenticated, service_role;

-- Compatibility wrappers. They are deliberately SECURITY INVOKER so the exposed
-- REST RPC surface does not itself run with elevated database privileges.
create or replace function public.is_app_admin()
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select private.is_app_admin();
$$;

create or replace function public.has_project_access(p_project_id uuid)
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select private.has_project_access(p_project_id);
$$;

revoke all on function public.is_app_admin() from public;
revoke all on function public.has_project_access(uuid) from public;
grant execute on function public.is_app_admin() to authenticated, service_role;
grant execute on function public.has_project_access(uuid) to authenticated, service_role;
