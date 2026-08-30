create table if not exists public.drying_yard_award_approval_audit (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null unique,
  project_id uuid not null references public.core_projects(id) on delete cascade,
  cluster_id uuid not null references public.drying_yard_procurement_clusters(id) on delete cascade,
  action text not null check (action in ('award_approved','framework_activated')),
  approved_by_user_id text not null,
  approved_by_email text not null,
  approved_by_name text not null,
  approved_by_role text not null check (approved_by_role in ('EXECUTIVE','ADMIN')),
  approval_reason text not null check (char_length(trim(approval_reason)) between 8 and 2000),
  primary_bid_id uuid references public.drying_yard_procurement_bids(id),
  backup_bid_id uuid references public.drying_yard_procurement_bids(id),
  primary_supplier_name text,
  backup_supplier_name text,
  primary_tdc_per_m3 numeric,
  backup_tdc_per_m3 numeric,
  forecast_gm numeric not null,
  gm_floor numeric not null,
  min_rolling_cash numeric not null,
  safety_reserve numeric not null,
  confirmed_customer_funding_pct numeric not null,
  precheck_snapshot jsonb not null default '{}'::jsonb,
  framework_snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists drying_yard_award_audit_cluster_created_idx
  on public.drying_yard_award_approval_audit(cluster_id, created_at desc);
create index if not exists drying_yard_award_audit_project_created_idx
  on public.drying_yard_award_approval_audit(project_id, created_at desc);

alter table public.drying_yard_award_approval_audit enable row level security;

create or replace function public.drying_yard_award_audit_immutable()
returns trigger
language plpgsql
as $$
begin
  raise exception 'AWARD_AUDIT_IMMUTABLE';
end;
$$;

drop trigger if exists trg_drying_yard_award_audit_immutable on public.drying_yard_award_approval_audit;
create trigger trg_drying_yard_award_audit_immutable
before update or delete on public.drying_yard_award_approval_audit
for each row execute function public.drying_yard_award_audit_immutable();

create or replace function public.drying_yard_apply_manual_award(
  p_request_id uuid,
  p_project_id uuid,
  p_cluster_id uuid,
  p_primary_bid_id uuid,
  p_backup_bid_id uuid,
  p_approved_by_user_id text,
  p_approved_by_email text,
  p_approved_by_name text,
  p_approved_by_role text,
  p_approval_reason text,
  p_forecast_gm numeric,
  p_gm_floor numeric,
  p_min_rolling_cash numeric,
  p_safety_reserve numeric,
  p_confirmed_customer_funding_pct numeric,
  p_precheck_snapshot jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_existing public.drying_yard_award_approval_audit%rowtype;
  v_cluster public.drying_yard_procurement_clusters%rowtype;
  v_primary public.drying_yard_procurement_bids%rowtype;
  v_backup public.drying_yard_procurement_bids%rowtype;
  v_primary_tdc numeric;
  v_backup_tdc numeric;
  v_framework public.drying_yard_framework_agreements%rowtype;
begin
  select * into v_existing from public.drying_yard_award_approval_audit where request_id = p_request_id;
  if found then
    return jsonb_build_object('ok', true, 'idempotent', true, 'audit_id', v_existing.id, 'action', v_existing.action);
  end if;

  if p_approved_by_role not in ('EXECUTIVE','ADMIN') then raise exception 'APPROVER_ROLE_BLOCK'; end if;
  if char_length(trim(coalesce(p_approval_reason,''))) < 8 then raise exception 'APPROVAL_REASON_REQUIRED'; end if;
  if p_primary_bid_id = p_backup_bid_id then raise exception 'PRIMARY_BACKUP_MUST_DIFFER'; end if;
  if p_forecast_gm < greatest(0.32::numeric, p_gm_floor) then raise exception 'GM_GATE_BLOCK'; end if;
  if p_min_rolling_cash < p_safety_reserve then raise exception 'CASH_GATE_BLOCK'; end if;
  if p_confirmed_customer_funding_pct <= 0 then raise exception 'FUNDING_GATE_BLOCK'; end if;

  select * into v_cluster from public.drying_yard_procurement_clusters
  where id = p_cluster_id and project_id = p_project_id for update;
  if not found then raise exception 'CLUSTER_NOT_FOUND'; end if;

  select * into v_primary from public.drying_yard_procurement_bids
  where id = p_primary_bid_id and project_id = p_project_id and cluster_id = p_cluster_id for update;
  if not found then raise exception 'PRIMARY_BID_NOT_FOUND'; end if;

  select * into v_backup from public.drying_yard_procurement_bids
  where id = p_backup_bid_id and project_id = p_project_id and cluster_id = p_cluster_id for update;
  if not found then raise exception 'BACKUP_BID_NOT_FOUND'; end if;

  if v_primary.bid_status <> 'confirmed' or v_backup.bid_status <> 'confirmed' then raise exception 'BID_NOT_CONFIRMED'; end if;
  if v_primary.valid_until is null or v_primary.valid_until < current_date or
     v_backup.valid_until is null or v_backup.valid_until < current_date then raise exception 'QUOTE_EXPIRED_OR_INVALID'; end if;
  if coalesce(v_primary.capacity_m3_day,0) <= 0 or coalesce(v_backup.capacity_m3_day,0) <= 0 or
     v_primary.lead_time_days is null or v_backup.lead_time_days is null or
     nullif(trim(coalesce(v_primary.payment_terms,'')),'') is null or
     nullif(trim(coalesce(v_backup.payment_terms,'')),'') is null or
     nullif(trim(coalesce(v_primary.supplier_name,'')),'') is null or
     nullif(trim(coalesce(v_backup.supplier_name,'')),'') is null or
     nullif(trim(coalesce(v_primary.quotation_ref,'')),'') is null or
     nullif(trim(coalesce(v_backup.quotation_ref,'')),'') is null then
    raise exception 'BID_READINESS_BLOCK';
  end if;

  v_primary_tdc := v_primary.base_rate + v_primary.freight_per_m3 + v_primary.pump_per_m3 + v_primary.waiting_per_m3 + v_primary.short_load_per_m3
    - v_primary.cash_discount_per_m3 - v_primary.volume_rebate_per_m3 - v_primary.schedule_discount_per_m3 + v_primary.other_adjustment_per_m3;
  v_backup_tdc := v_backup.base_rate + v_backup.freight_per_m3 + v_backup.pump_per_m3 + v_backup.waiting_per_m3 + v_backup.short_load_per_m3
    - v_backup.cash_discount_per_m3 - v_backup.volume_rebate_per_m3 - v_backup.schedule_discount_per_m3 + v_backup.other_adjustment_per_m3;
  if v_primary_tdc <= 0 or v_backup_tdc <= 0 then raise exception 'INVALID_TDC'; end if;

  update public.drying_yard_procurement_clusters
  set awarded_supplier_name = v_primary.supplier_name,
      awarded_effective_rate = v_primary_tdc,
      rfq_status = 'awarded',
      updated_at = now()
  where id = p_cluster_id and project_id = p_project_id;

  update public.drying_yard_framework_agreements
  set primary_bid_id = p_primary_bid_id,
      backup_bid_id = p_backup_bid_id,
      status = 'award_approved',
      updated_at = now()
  where cluster_id = p_cluster_id and project_id = p_project_id
  returning * into v_framework;
  if not found then raise exception 'FRAMEWORK_DRAFT_NOT_FOUND'; end if;

  insert into public.drying_yard_award_approval_audit (
    request_id, project_id, cluster_id, action,
    approved_by_user_id, approved_by_email, approved_by_name, approved_by_role, approval_reason,
    primary_bid_id, backup_bid_id, primary_supplier_name, backup_supplier_name,
    primary_tdc_per_m3, backup_tdc_per_m3,
    forecast_gm, gm_floor, min_rolling_cash, safety_reserve, confirmed_customer_funding_pct,
    precheck_snapshot, framework_snapshot
  ) values (
    p_request_id, p_project_id, p_cluster_id, 'award_approved',
    trim(p_approved_by_user_id), lower(trim(p_approved_by_email)), trim(p_approved_by_name), p_approved_by_role, trim(p_approval_reason),
    p_primary_bid_id, p_backup_bid_id, v_primary.supplier_name, v_backup.supplier_name,
    v_primary_tdc, v_backup_tdc,
    p_forecast_gm, p_gm_floor, p_min_rolling_cash, p_safety_reserve, p_confirmed_customer_funding_pct,
    coalesce(p_precheck_snapshot,'{}'::jsonb), to_jsonb(v_framework)
  ) returning * into v_existing;

  return jsonb_build_object(
    'ok', true, 'audit_id', v_existing.id, 'action', 'award_approved', 'cluster_id', p_cluster_id,
    'primary_supplier', v_primary.supplier_name, 'backup_supplier', v_backup.supplier_name,
    'primary_tdc_per_m3', v_primary_tdc, 'backup_tdc_per_m3', v_backup_tdc,
    'framework_status', v_framework.status
  );
end;
$$;

create or replace function public.drying_yard_activate_framework_agreement(
  p_request_id uuid,
  p_project_id uuid,
  p_cluster_id uuid,
  p_agreement_no text,
  p_effective_from date,
  p_effective_to date,
  p_approved_by_user_id text,
  p_approved_by_email text,
  p_approved_by_name text,
  p_approved_by_role text,
  p_approval_reason text,
  p_forecast_gm numeric,
  p_gm_floor numeric,
  p_min_rolling_cash numeric,
  p_safety_reserve numeric,
  p_confirmed_customer_funding_pct numeric,
  p_precheck_snapshot jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_existing public.drying_yard_award_approval_audit%rowtype;
  v_framework public.drying_yard_framework_agreements%rowtype;
  v_primary public.drying_yard_procurement_bids%rowtype;
  v_backup public.drying_yard_procurement_bids%rowtype;
  v_primary_tdc numeric;
  v_backup_tdc numeric;
  v_funding_pct numeric := 0;
begin
  select * into v_existing from public.drying_yard_award_approval_audit where request_id = p_request_id;
  if found then
    return jsonb_build_object('ok', true, 'idempotent', true, 'audit_id', v_existing.id, 'action', v_existing.action);
  end if;

  if p_approved_by_role not in ('EXECUTIVE','ADMIN') then raise exception 'APPROVER_ROLE_BLOCK'; end if;
  if char_length(trim(coalesce(p_approval_reason,''))) < 8 then raise exception 'APPROVAL_REASON_REQUIRED'; end if;
  if nullif(trim(coalesce(p_agreement_no,'')),'') is null then raise exception 'AGREEMENT_NO_REQUIRED'; end if;
  if p_effective_from is null then raise exception 'EFFECTIVE_FROM_REQUIRED'; end if;
  if p_effective_to is not null and p_effective_to < p_effective_from then raise exception 'INVALID_EFFECTIVE_PERIOD'; end if;
  if p_forecast_gm < greatest(0.32::numeric, p_gm_floor) then raise exception 'GM_GATE_BLOCK'; end if;
  if p_min_rolling_cash < p_safety_reserve then raise exception 'CASH_GATE_BLOCK'; end if;

  select * into v_framework from public.drying_yard_framework_agreements
  where cluster_id = p_cluster_id and project_id = p_project_id for update;
  if not found then raise exception 'FRAMEWORK_DRAFT_NOT_FOUND'; end if;
  if v_framework.status <> 'award_approved' then raise exception 'AWARD_APPROVAL_REQUIRED'; end if;
  if v_framework.primary_bid_id is null or v_framework.backup_bid_id is null then raise exception 'PRIMARY_BACKUP_REQUIRED'; end if;

  select * into v_primary from public.drying_yard_procurement_bids where id=v_framework.primary_bid_id and project_id=p_project_id and cluster_id=p_cluster_id;
  select * into v_backup from public.drying_yard_procurement_bids where id=v_framework.backup_bid_id and project_id=p_project_id and cluster_id=p_cluster_id;
  if v_primary.id is null or v_backup.id is null then raise exception 'AWARDED_BID_NOT_FOUND'; end if;
  if v_primary.bid_status <> 'confirmed' or v_backup.bid_status <> 'confirmed' then raise exception 'BID_NOT_CONFIRMED'; end if;
  if v_primary.valid_until is null or v_primary.valid_until < current_date or v_backup.valid_until is null or v_backup.valid_until < current_date then raise exception 'QUOTE_EXPIRED_OR_INVALID'; end if;

  select coalesce(sum(funded_pct),0) into v_funding_pct
  from public.drying_yard_customer_material_funding
  where project_id=p_project_id and cluster_id=p_cluster_id
    and lower(status) in ('approved','active','confirmed')
    and funding_mode in ('customer_direct_pay','material_advance');
  v_funding_pct := least(100, greatest(0, v_funding_pct));
  if v_funding_pct <= 0 or p_confirmed_customer_funding_pct <= 0 then raise exception 'FUNDING_GATE_BLOCK'; end if;

  v_primary_tdc := v_primary.base_rate + v_primary.freight_per_m3 + v_primary.pump_per_m3 + v_primary.waiting_per_m3 + v_primary.short_load_per_m3
    - v_primary.cash_discount_per_m3 - v_primary.volume_rebate_per_m3 - v_primary.schedule_discount_per_m3 + v_primary.other_adjustment_per_m3;
  v_backup_tdc := v_backup.base_rate + v_backup.freight_per_m3 + v_backup.pump_per_m3 + v_backup.waiting_per_m3 + v_backup.short_load_per_m3
    - v_backup.cash_discount_per_m3 - v_backup.volume_rebate_per_m3 - v_backup.schedule_discount_per_m3 + v_backup.other_adjustment_per_m3;

  update public.drying_yard_framework_agreements
  set agreement_no=trim(p_agreement_no), effective_from=p_effective_from, effective_to=p_effective_to,
      status='active', updated_at=now()
  where id=v_framework.id
  returning * into v_framework;

  insert into public.drying_yard_award_approval_audit (
    request_id, project_id, cluster_id, action,
    approved_by_user_id, approved_by_email, approved_by_name, approved_by_role, approval_reason,
    primary_bid_id, backup_bid_id, primary_supplier_name, backup_supplier_name,
    primary_tdc_per_m3, backup_tdc_per_m3,
    forecast_gm, gm_floor, min_rolling_cash, safety_reserve, confirmed_customer_funding_pct,
    precheck_snapshot, framework_snapshot
  ) values (
    p_request_id, p_project_id, p_cluster_id, 'framework_activated',
    trim(p_approved_by_user_id), lower(trim(p_approved_by_email)), trim(p_approved_by_name), p_approved_by_role, trim(p_approval_reason),
    v_framework.primary_bid_id, v_framework.backup_bid_id, v_primary.supplier_name, v_backup.supplier_name,
    v_primary_tdc, v_backup_tdc,
    p_forecast_gm, p_gm_floor, p_min_rolling_cash, p_safety_reserve, v_funding_pct,
    coalesce(p_precheck_snapshot,'{}'::jsonb), to_jsonb(v_framework)
  ) returning * into v_existing;

  return jsonb_build_object(
    'ok', true, 'audit_id', v_existing.id, 'action', 'framework_activated', 'cluster_id', p_cluster_id,
    'agreement_no', v_framework.agreement_no, 'framework_status', v_framework.status,
    'effective_from', v_framework.effective_from, 'effective_to', v_framework.effective_to
  );
end;
$$;

revoke all on public.drying_yard_award_approval_audit from anon, authenticated;
revoke execute on function public.drying_yard_apply_manual_award(uuid,uuid,uuid,uuid,uuid,text,text,text,text,text,numeric,numeric,numeric,numeric,numeric,jsonb) from public, anon, authenticated;
revoke execute on function public.drying_yard_activate_framework_agreement(uuid,uuid,uuid,text,date,date,text,text,text,text,text,numeric,numeric,numeric,numeric,numeric,jsonb) from public, anon, authenticated;
grant execute on function public.drying_yard_apply_manual_award(uuid,uuid,uuid,uuid,uuid,text,text,text,text,text,numeric,numeric,numeric,numeric,numeric,jsonb) to service_role;
grant execute on function public.drying_yard_activate_framework_agreement(uuid,uuid,uuid,text,date,date,text,text,text,text,text,numeric,numeric,numeric,numeric,numeric,jsonb) to service_role;
