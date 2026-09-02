begin;

create table if not exists public.core_user_provisioning_audit (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.core_organizations(id) on delete cascade,
  target_user_id uuid null references auth.users(id) on delete set null,
  target_email text not null,
  target_member_role text not null check (target_member_role in ('owner', 'admin')),
  action text not null check (
    action in ('invite_organization_admin', 'provision_existing', 'rollback_invite')
  ),
  status text not null check (
    status in ('requested', 'invited', 'provisioned', 'failed', 'rolled_back')
  ),
  auth_mode text not null check (auth_mode in ('legacy', 'supabase')),
  actor_user_id uuid null references auth.users(id) on delete set null,
  actor_label text null,
  error_code text null,
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists core_user_provisioning_audit_org_created_idx
  on public.core_user_provisioning_audit (organization_id, created_at desc);

create index if not exists core_user_provisioning_audit_email_created_idx
  on public.core_user_provisioning_audit (lower(target_email), created_at desc);

alter table public.core_user_provisioning_audit enable row level security;

-- Provisioning records contain access-control and invitation metadata. They are
-- intentionally service-role only; no browser/client role receives table access.
revoke all on table public.core_user_provisioning_audit from anon, authenticated;

comment on table public.core_user_provisioning_audit is
  'ISO-oriented audit trail for SiteCost Auth invitation and organization membership provisioning.';

commit;
