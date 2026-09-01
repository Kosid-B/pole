-- SiteCost SaaS multi-project tenancy foundation.
-- Production was applied through the Supabase migration API before this file was
-- checked in. Keep this migration idempotent so fresh environments converge to
-- the same Organization -> Project -> Module -> Membership model.

create table if not exists public.core_organizations (
  id uuid primary key default gen_random_uuid(),
  org_code text not null unique,
  org_name text not null,
  status text not null default 'active' check (status in ('active','inactive','suspended')),
  created_by uuid null references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.core_organization_members (
  organization_id uuid not null references public.core_organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  member_role text not null check (
    member_role in ('owner','executive','admin','pm','commercial','procurement','finance','field_leader','viewer')
  ),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);

alter table public.core_projects
  add column if not exists organization_id uuid null
  references public.core_organizations(id) on delete restrict;

insert into public.core_organizations (org_code, org_name, status)
values ('DEFAULT', 'SiteCost Default Organization', 'active')
on conflict (org_code) do update
set org_name = excluded.org_name,
    status = excluded.status,
    updated_at = now();

update public.core_projects p
set organization_id = o.id
from public.core_organizations o
where o.org_code = 'DEFAULT'
  and p.organization_id is null;

create index if not exists core_projects_organization_id_idx
  on public.core_projects(organization_id);
create index if not exists core_organization_members_user_id_idx
  on public.core_organization_members(user_id);

create table if not exists public.core_project_modules (
  project_id uuid not null references public.core_projects(id) on delete cascade,
  module_code text not null check (module_code in ('commercial','pm','procurement','field','finance')),
  label_th text not null,
  label_en text not null,
  route text not null,
  audience text not null default 'internal' check (audience in ('internal','field','customer')),
  is_active boolean not null default true,
  sort_order integer not null default 0,
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (project_id, module_code)
);

create table if not exists public.core_project_member_modules (
  project_id uuid not null,
  user_id uuid not null,
  module_code text not null,
  can_view boolean not null default true,
  can_edit boolean not null default false,
  can_approve boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (project_id, user_id, module_code),
  foreign key (project_id, user_id)
    references public.core_project_members(project_id, user_id)
    on delete cascade,
  foreign key (project_id, module_code)
    references public.core_project_modules(project_id, module_code)
    on delete cascade
);

insert into public.core_project_modules
  (project_id, module_code, label_th, label_en, route, audience, sort_order)
select p.id, m.module_code, m.label_th, m.label_en, m.route, m.audience, m.sort_order
from public.core_projects p
cross join (
  values
    ('commercial','Commercial / Pricing','Commercial','/commercial','internal',10),
    ('pm','PM Control','Project Management','/pm','internal',20),
    ('procurement','Procurement','Procurement','/procurement','internal',30),
    ('field','Field Operations','Field','/field-reports','field',40),
    ('finance','Finance & Cash','Finance','/finance','internal',50)
) as m(module_code,label_th,label_en,route,audience,sort_order)
on conflict (project_id, module_code) do nothing;

alter table public.core_organizations enable row level security;
alter table public.core_organization_members enable row level security;
alter table public.core_project_modules enable row level security;
alter table public.core_project_member_modules enable row level security;

revoke all on table public.core_organizations from anon, authenticated;
revoke all on table public.core_organization_members from anon, authenticated;
revoke all on table public.core_project_modules from anon, authenticated;
revoke all on table public.core_project_member_modules from anon, authenticated;

grant select on table public.core_organizations to authenticated;
grant select on table public.core_organization_members to authenticated;
grant select on table public.core_project_modules to authenticated;
grant select on table public.core_project_member_modules to authenticated;
grant select, insert, update, delete on table public.core_organizations to service_role;
grant select, insert, update, delete on table public.core_organization_members to service_role;
grant select, insert, update, delete on table public.core_project_modules to service_role;
grant select, insert, update, delete on table public.core_project_member_modules to service_role;

drop policy if exists "org_members_select_own" on public.core_organization_members;
create policy "org_members_select_own"
on public.core_organization_members
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "organizations_select_member" on public.core_organizations;
create policy "organizations_select_member"
on public.core_organizations
for select
to authenticated
using (
  exists (
    select 1
    from public.core_organization_members m
    where m.organization_id = core_organizations.id
      and m.user_id = (select auth.uid())
      and m.is_active
  )
);

drop policy if exists "project_modules_select_project_access" on public.core_project_modules;
create policy "project_modules_select_project_access"
on public.core_project_modules
for select
to authenticated
using ((select public.has_project_access(project_id)));

drop policy if exists "project_member_modules_select_own_or_admin" on public.core_project_member_modules;
create policy "project_member_modules_select_own_or_admin"
on public.core_project_member_modules
for select
to authenticated
using (
  user_id = (select auth.uid())
  or (select public.is_app_admin())
);
