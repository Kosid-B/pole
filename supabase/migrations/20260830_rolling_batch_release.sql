create table if not exists public.drying_yard_batch_releases (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.core_projects(id) on delete cascade,
  cluster_id uuid not null references public.drying_yard_procurement_clusters(id) on delete cascade,
  batch_no integer not null check (batch_no > 0),
  batch_code text not null,
  province text not null,
  planned_site_count integer not null check (planned_site_count > 0),
  planned_volume_m3 numeric not null default 0 check (planned_volume_m3 >= 0),
  planned_start_at timestamptz,
  status text not null default 'planned' check (status in ('planned','hold','ready_for_release','released','in_progress','completed','cancelled')),
  released_by_user_id text,
  released_by_email text,
  released_by_name text,
  released_by_role text,
  release_reason text,
  released_at timestamptz,
  gate_snapshot jsonb not null default '{}'::jsonb,
  site_readiness_snapshot jsonb not null default '{}'::jsonb,
  procurement_snapshot jsonb not null default '{}'::jsonb,
  supplier_capacity_snapshot jsonb not null default '{}'::jsonb,
  financial_snapshot jsonb not null default '{}'::jsonb,
  funding_snapshot jsonb not null default '{}'::jsonb,
  commitment_snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(project_id, cluster_id, batch_no),
  unique(project_id, batch_code)
);

create table if not exists public.drying_yard_batch_release_sites (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references public.drying_yard_batch_releases(id) on delete cascade,
  site_id uuid not null references public.core_installation_sites(id) on delete cascade,
  sequence_no integer not null check (sequence_no > 0),
  readiness_status text not null default 'planned' check (readiness_status in ('planned','checking','ready','blocked','released','completed')),
  quantity_confirmed boolean not null default false,
  drawing_confirmed boolean not null default false,
  site_condition_confirmed boolean not null default false,
  access_ready boolean not null default false,
  confirmed_area_m2 numeric check (confirmed_area_m2 is null or confirmed_area_m2 >= 0),
  confirmed_concrete_m3 numeric check (confirmed_concrete_m3 is null or confirmed_concrete_m3 >= 0),
  evidence_ref text,
  readiness_note text,
  readiness_checked_by_user_id text,
  readiness_checked_by_email text,
  readiness_checked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(batch_id, site_id),
  unique(site_id)
);

create table if not exists public.drying_yard_batch_release_audit (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null unique,
  project_id uuid not null references public.core_projects(id) on delete cascade,
  batch_id uuid not null references public.drying_yard_batch_releases(id) on delete cascade,
  cluster_id uuid not null references public.drying_yard_procurement_clusters(id) on delete cascade,
  action text not null check (action in ('schedule_updated','site_readiness_updated','release_approved','release_blocked','hold_applied','batch_completed')),
  decision text not null check (decision in ('updated','approved','blocked','hold','completed')),
  actor_user_id text not null,
  actor_email text not null,
  actor_name text not null,
  actor_role text not null check (actor_role in ('EXECUTIVE','ADMIN')),
  reason text not null check (char_length(trim(reason)) between 8 and 2000),
  snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists drying_yard_batch_release_project_status_idx on public.drying_yard_batch_releases(project_id,status,batch_no);
create index if not exists drying_yard_batch_release_cluster_idx on public.drying_yard_batch_releases(cluster_id,batch_no);
create index if not exists drying_yard_batch_release_sites_batch_idx on public.drying_yard_batch_release_sites(batch_id,sequence_no);
create index if not exists drying_yard_batch_release_audit_batch_idx on public.drying_yard_batch_release_audit(batch_id,created_at desc);

alter table public.drying_yard_batch_releases enable row level security;
alter table public.drying_yard_batch_release_sites enable row level security;
alter table public.drying_yard_batch_release_audit enable row level security;

create or replace function public.drying_yard_batch_release_audit_immutable()
returns trigger language plpgsql as $$
begin
  raise exception 'BATCH_RELEASE_AUDIT_IMMUTABLE';
end;
$$;

drop trigger if exists trg_drying_yard_batch_release_audit_immutable on public.drying_yard_batch_release_audit;
create trigger trg_drying_yard_batch_release_audit_immutable
before update or delete on public.drying_yard_batch_release_audit
for each row execute function public.drying_yard_batch_release_audit_immutable();

with ranked as (
  select s.project_id,c.id as cluster_id,c.province,s.id as site_id,
    row_number() over (partition by s.project_id,c.id order by coalesce(nullif(s.metadata->>'district_order','')::integer,9999),coalesce(nullif(s.metadata->>'district_sequence','')::integer,9999),s.site_code) as rn,
    greatest(1,coalesce(cs.batch_size_sites,25)) as batch_size,
    case when c.forecast_sites > 0 then c.forecast_volume_m3 / c.forecast_sites else 0 end as unit_volume
  from public.core_installation_sites s
  join public.core_locations l on l.id=s.location_id
  join public.drying_yard_procurement_clusters c on c.project_id=s.project_id and c.province=l.province and c.material_group='CONCRETE_240KSC'
  left join public.drying_yard_pm_cashflow_settings cs on cs.project_id=s.project_id
), batch_defs as (
  select project_id,cluster_id,province,floor((rn-1)/batch_size)::integer + 1 as batch_no,count(*)::integer as planned_site_count,sum(unit_volume)::numeric as planned_volume_m3
  from ranked group by project_id,cluster_id,province,floor((rn-1)/batch_size)::integer + 1
), numbered as (
  select *,row_number() over (partition by project_id order by province,batch_no) as project_batch_seq from batch_defs
)
insert into public.drying_yard_batch_releases(project_id,cluster_id,batch_no,batch_code,province,planned_site_count,planned_volume_m3)
select project_id,cluster_id,batch_no,'RB-'||lpad(project_batch_seq::text,3,'0'),province,planned_site_count,planned_volume_m3 from numbered
on conflict (project_id,cluster_id,batch_no) do nothing;

with ranked as (
  select s.project_id,c.id as cluster_id,s.id as site_id,
    row_number() over (partition by s.project_id,c.id order by coalesce(nullif(s.metadata->>'district_order','')::integer,9999),coalesce(nullif(s.metadata->>'district_sequence','')::integer,9999),s.site_code) as rn,
    greatest(1,coalesce(cs.batch_size_sites,25)) as batch_size
  from public.core_installation_sites s
  join public.core_locations l on l.id=s.location_id
  join public.drying_yard_procurement_clusters c on c.project_id=s.project_id and c.province=l.province and c.material_group='CONCRETE_240KSC'
  left join public.drying_yard_pm_cashflow_settings cs on cs.project_id=s.project_id
), mapped as (
  select project_id,cluster_id,site_id,floor((rn-1)/batch_size)::integer + 1 as batch_no,((rn-1)%batch_size)::integer + 1 as sequence_no from ranked
)
insert into public.drying_yard_batch_release_sites(batch_id,site_id,sequence_no)
select b.id,m.site_id,m.sequence_no from mapped m
join public.drying_yard_batch_releases b on b.project_id=m.project_id and b.cluster_id=m.cluster_id and b.batch_no=m.batch_no
on conflict (site_id) do nothing;

create or replace function public.drying_yard_set_batch_schedule(
  p_request_id uuid,p_project_id uuid,p_batch_id uuid,p_planned_start_at timestamptz,
  p_actor_user_id text,p_actor_email text,p_actor_name text,p_actor_role text,p_reason text
) returns jsonb language plpgsql security definer set search_path=public as $$
declare v_batch public.drying_yard_batch_releases%rowtype; v_existing public.drying_yard_batch_release_audit%rowtype;
begin
  select * into v_existing from public.drying_yard_batch_release_audit where request_id=p_request_id;
  if found then return jsonb_build_object('ok',true,'idempotent',true,'audit_id',v_existing.id); end if;
  if p_actor_role not in ('EXECUTIVE','ADMIN') then raise exception 'APPROVER_ROLE_BLOCK'; end if;
  if char_length(trim(coalesce(p_reason,''))) < 8 then raise exception 'REASON_REQUIRED'; end if;
  if p_planned_start_at is null or p_planned_start_at <= now() then raise exception 'FUTURE_PLANNED_START_REQUIRED'; end if;
  select * into v_batch from public.drying_yard_batch_releases where id=p_batch_id and project_id=p_project_id for update;
  if not found then raise exception 'BATCH_NOT_FOUND'; end if;
  if v_batch.status in ('released','in_progress','completed','cancelled') then raise exception 'BATCH_SCHEDULE_LOCKED'; end if;
  update public.drying_yard_batch_releases set planned_start_at=p_planned_start_at,updated_at=now() where id=p_batch_id returning * into v_batch;
  insert into public.drying_yard_batch_release_audit(request_id,project_id,batch_id,cluster_id,action,decision,actor_user_id,actor_email,actor_name,actor_role,reason,snapshot)
  values(p_request_id,p_project_id,p_batch_id,v_batch.cluster_id,'schedule_updated','updated',trim(p_actor_user_id),lower(trim(p_actor_email)),trim(p_actor_name),p_actor_role,trim(p_reason),jsonb_build_object('planned_start_at',p_planned_start_at,'batch_code',v_batch.batch_code)) returning * into v_existing;
  return jsonb_build_object('ok',true,'audit_id',v_existing.id,'batch_id',v_batch.id,'planned_start_at',v_batch.planned_start_at);
end; $$;

create or replace function public.drying_yard_set_batch_site_readiness(
  p_request_id uuid,p_project_id uuid,p_batch_id uuid,p_site_id uuid,
  p_quantity_confirmed boolean,p_drawing_confirmed boolean,p_site_condition_confirmed boolean,p_access_ready boolean,
  p_confirmed_area_m2 numeric,p_confirmed_concrete_m3 numeric,p_evidence_ref text,p_readiness_note text,
  p_actor_user_id text,p_actor_email text,p_actor_name text,p_actor_role text,p_reason text
) returns jsonb language plpgsql security definer set search_path=public as $$
declare v_batch public.drying_yard_batch_releases%rowtype; v_site public.drying_yard_batch_release_sites%rowtype; v_existing public.drying_yard_batch_release_audit%rowtype; v_ready boolean;
begin
  select * into v_existing from public.drying_yard_batch_release_audit where request_id=p_request_id;
  if found then return jsonb_build_object('ok',true,'idempotent',true,'audit_id',v_existing.id); end if;
  if p_actor_role not in ('EXECUTIVE','ADMIN') then raise exception 'APPROVER_ROLE_BLOCK'; end if;
  if char_length(trim(coalesce(p_reason,''))) < 8 then raise exception 'REASON_REQUIRED'; end if;
  if coalesce(p_confirmed_concrete_m3,0) < 0 or coalesce(p_confirmed_area_m2,0) < 0 then raise exception 'INVALID_CONFIRMED_QUANTITY'; end if;
  select * into v_batch from public.drying_yard_batch_releases where id=p_batch_id and project_id=p_project_id for update;
  if not found then raise exception 'BATCH_NOT_FOUND'; end if;
  if v_batch.status in ('released','in_progress','completed','cancelled') then raise exception 'BATCH_READINESS_LOCKED'; end if;
  select * into v_site from public.drying_yard_batch_release_sites where batch_id=p_batch_id and site_id=p_site_id for update;
  if not found then raise exception 'BATCH_SITE_NOT_FOUND'; end if;
  v_ready := coalesce(p_quantity_confirmed,false) and coalesce(p_drawing_confirmed,false) and coalesce(p_site_condition_confirmed,false) and coalesce(p_access_ready,false) and coalesce(p_confirmed_concrete_m3,0)>0;
  update public.drying_yard_batch_release_sites set quantity_confirmed=coalesce(p_quantity_confirmed,false),drawing_confirmed=coalesce(p_drawing_confirmed,false),site_condition_confirmed=coalesce(p_site_condition_confirmed,false),access_ready=coalesce(p_access_ready,false),confirmed_area_m2=p_confirmed_area_m2,confirmed_concrete_m3=p_confirmed_concrete_m3,evidence_ref=nullif(trim(coalesce(p_evidence_ref,'')),''),readiness_note=nullif(trim(coalesce(p_readiness_note,'')),''),readiness_status=case when v_ready then 'ready' else 'checking' end,readiness_checked_by_user_id=trim(p_actor_user_id),readiness_checked_by_email=lower(trim(p_actor_email)),readiness_checked_at=now(),updated_at=now() where id=v_site.id returning * into v_site;
  insert into public.drying_yard_batch_release_audit(request_id,project_id,batch_id,cluster_id,action,decision,actor_user_id,actor_email,actor_name,actor_role,reason,snapshot)
  values(p_request_id,p_project_id,p_batch_id,v_batch.cluster_id,'site_readiness_updated','updated',trim(p_actor_user_id),lower(trim(p_actor_email)),trim(p_actor_name),p_actor_role,trim(p_reason),to_jsonb(v_site)) returning * into v_existing;
  return jsonb_build_object('ok',true,'audit_id',v_existing.id,'site_id',v_site.site_id,'ready',v_ready,'readiness_status',v_site.readiness_status);
end; $$;

create or replace function public.drying_yard_apply_batch_release(
  p_request_id uuid,p_project_id uuid,p_batch_id uuid,p_actor_user_id text,p_actor_email text,p_actor_name text,p_actor_role text,p_reason text,p_gate_snapshot jsonb
) returns jsonb language plpgsql security definer set search_path=public as $$
declare
  v_existing public.drying_yard_batch_release_audit%rowtype; v_batch public.drying_yard_batch_releases%rowtype; v_framework public.drying_yard_framework_agreements%rowtype;
  v_primary public.drying_yard_procurement_bids%rowtype; v_backup public.drying_yard_procurement_bids%rowtype;
  v_site_total integer; v_site_ready integer; v_confirmed_volume numeric; v_funding_pct numeric; v_weighted_capacity numeric; v_required_daily numeric;
  v_financial jsonb; v_site_snapshot jsonb; v_procurement_snapshot jsonb; v_capacity_snapshot jsonb; v_funding_snapshot jsonb; v_commitment_snapshot jsonb;
begin
  select * into v_existing from public.drying_yard_batch_release_audit where request_id=p_request_id;
  if found then return jsonb_build_object('ok',true,'idempotent',true,'audit_id',v_existing.id,'action',v_existing.action); end if;
  if p_actor_role not in ('EXECUTIVE','ADMIN') then raise exception 'APPROVER_ROLE_BLOCK'; end if;
  if char_length(trim(coalesce(p_reason,''))) < 8 then raise exception 'RELEASE_REASON_REQUIRED'; end if;
  select * into v_batch from public.drying_yard_batch_releases where id=p_batch_id and project_id=p_project_id for update;
  if not found then raise exception 'BATCH_NOT_FOUND'; end if;
  if v_batch.status in ('released','in_progress','completed','cancelled') then raise exception 'BATCH_ALREADY_LOCKED'; end if;
  if v_batch.planned_start_at is null then raise exception 'BATCH_SCHEDULE_REQUIRED'; end if;
  select count(*),count(*) filter(where quantity_confirmed and drawing_confirmed and site_condition_confirmed and access_ready and coalesce(confirmed_concrete_m3,0)>0),coalesce(sum(confirmed_concrete_m3),0)
    into v_site_total,v_site_ready,v_confirmed_volume from public.drying_yard_batch_release_sites where batch_id=p_batch_id;
  if v_site_total=0 or v_site_ready<>v_site_total then raise exception 'SITE_READINESS_GATE_BLOCK'; end if;
  select * into v_framework from public.drying_yard_framework_agreements where project_id=p_project_id and cluster_id=v_batch.cluster_id for update;
  if not found or v_framework.status<>'active' or nullif(trim(coalesce(v_framework.agreement_no,'')),'') is null or v_framework.primary_bid_id is null or v_framework.backup_bid_id is null then raise exception 'FRAMEWORK_GATE_BLOCK'; end if;
  if v_framework.effective_from is null or v_batch.planned_start_at::date<v_framework.effective_from or (v_framework.effective_to is not null and v_batch.planned_start_at::date>v_framework.effective_to) then raise exception 'FRAMEWORK_EFFECTIVE_PERIOD_BLOCK'; end if;
  if v_batch.planned_start_at<now()+make_interval(hours=>v_framework.calloff_notice_hours) then raise exception 'CALLOFF_NOTICE_GATE_BLOCK'; end if;
  if v_batch.planned_start_at>now()+make_interval(days=>v_framework.rolling_forecast_days) then raise exception 'ROLLING_FORECAST_WINDOW_BLOCK'; end if;
  select * into v_primary from public.drying_yard_procurement_bids where id=v_framework.primary_bid_id and project_id=p_project_id and cluster_id=v_batch.cluster_id;
  select * into v_backup from public.drying_yard_procurement_bids where id=v_framework.backup_bid_id and project_id=p_project_id and cluster_id=v_batch.cluster_id;
  if v_primary.id is null or v_backup.id is null or v_primary.bid_status<>'confirmed' or v_backup.bid_status<>'confirmed' then raise exception 'SUPPLIER_PAIR_GATE_BLOCK'; end if;
  if coalesce(v_primary.capacity_m3_day,0)<=0 or coalesce(v_backup.capacity_m3_day,0)<=0 then raise exception 'SUPPLIER_CAPACITY_MISSING'; end if;
  v_weighted_capacity:=coalesce(v_primary.capacity_m3_day,0)*coalesce(v_framework.primary_share_pct,0)/100+coalesce(v_backup.capacity_m3_day,0)*coalesce(v_framework.backup_share_pct,0)/100;
  v_required_daily:=case when v_framework.rolling_forecast_days>0 then v_confirmed_volume/v_framework.rolling_forecast_days else v_confirmed_volume end;
  if v_weighted_capacity+0.0001<v_required_daily then raise exception 'SUPPLIER_CAPACITY_GATE_BLOCK'; end if;
  select least(100,greatest(0,coalesce(sum(funded_pct),0))) into v_funding_pct from public.drying_yard_customer_material_funding where project_id=p_project_id and cluster_id=v_batch.cluster_id and lower(status) in ('approved','active','confirmed') and funding_mode in ('customer_direct_pay','material_advance');
  if coalesce(v_funding_pct,0)<=0 then raise exception 'CUSTOMER_FUNDING_GATE_BLOCK'; end if;
  v_financial:=coalesce(p_gate_snapshot->'financial','{}'::jsonb);
  if coalesce((v_financial->>'gm_pass')::boolean,false)=false or coalesce((v_financial->>'forecast_gm')::numeric,0)<0.32 then raise exception 'GM_GATE_BLOCK'; end if;
  if coalesce((v_financial->>'cash_pass')::boolean,false)=false or coalesce((v_financial->>'min_cash')::numeric,0)<coalesce((v_financial->>'safety_reserve')::numeric,0) then raise exception 'CASH_GATE_BLOCK'; end if;
  if coalesce((v_financial->>'commitment_pass')::boolean,false)=false or coalesce((v_financial->>'four_week_coverage_after_reserve')::numeric,-1)<0 then raise exception 'COMMITMENT_GATE_BLOCK'; end if;
  v_site_snapshot:=jsonb_build_object('sites',v_site_total,'ready',v_site_ready,'confirmed_volume_m3',v_confirmed_volume);
  v_procurement_snapshot:=jsonb_build_object('framework_id',v_framework.id,'agreement_no',v_framework.agreement_no,'effective_from',v_framework.effective_from,'effective_to',v_framework.effective_to,'calloff_notice_hours',v_framework.calloff_notice_hours,'rolling_forecast_days',v_framework.rolling_forecast_days,'primary_bid_id',v_framework.primary_bid_id,'backup_bid_id',v_framework.backup_bid_id);
  v_capacity_snapshot:=jsonb_build_object('primary_supplier',v_primary.supplier_name,'backup_supplier',v_backup.supplier_name,'primary_capacity_m3_day',v_primary.capacity_m3_day,'backup_capacity_m3_day',v_backup.capacity_m3_day,'weighted_capacity_m3_day',v_weighted_capacity,'required_daily_m3',v_required_daily);
  v_funding_snapshot:=jsonb_build_object('confirmed_cluster_funding_pct',v_funding_pct,'payment_mode',v_framework.payment_mode);
  v_commitment_snapshot:=coalesce(p_gate_snapshot->'commitment','{}'::jsonb);
  update public.drying_yard_batch_releases set status='released',released_by_user_id=trim(p_actor_user_id),released_by_email=lower(trim(p_actor_email)),released_by_name=trim(p_actor_name),released_by_role=p_actor_role,release_reason=trim(p_reason),released_at=now(),gate_snapshot=coalesce(p_gate_snapshot,'{}'::jsonb),site_readiness_snapshot=v_site_snapshot,procurement_snapshot=v_procurement_snapshot,supplier_capacity_snapshot=v_capacity_snapshot,financial_snapshot=v_financial,funding_snapshot=v_funding_snapshot,commitment_snapshot=v_commitment_snapshot,updated_at=now() where id=p_batch_id returning * into v_batch;
  update public.drying_yard_batch_release_sites set readiness_status='released',updated_at=now() where batch_id=p_batch_id;
  insert into public.drying_yard_batch_release_audit(request_id,project_id,batch_id,cluster_id,action,decision,actor_user_id,actor_email,actor_name,actor_role,reason,snapshot)
  values(p_request_id,p_project_id,p_batch_id,v_batch.cluster_id,'release_approved','approved',trim(p_actor_user_id),lower(trim(p_actor_email)),trim(p_actor_name),p_actor_role,trim(p_reason),jsonb_build_object('batch',to_jsonb(v_batch),'gates',p_gate_snapshot,'site_readiness',v_site_snapshot,'procurement',v_procurement_snapshot,'capacity',v_capacity_snapshot,'funding',v_funding_snapshot)) returning * into v_existing;
  return jsonb_build_object('ok',true,'audit_id',v_existing.id,'batch_id',v_batch.id,'batch_code',v_batch.batch_code,'status',v_batch.status,'released_at',v_batch.released_at);
end; $$;

revoke all on public.drying_yard_batch_releases from anon,authenticated;
revoke all on public.drying_yard_batch_release_sites from anon,authenticated;
revoke all on public.drying_yard_batch_release_audit from anon,authenticated;
revoke execute on function public.drying_yard_set_batch_schedule(uuid,uuid,uuid,timestamptz,text,text,text,text,text) from public,anon,authenticated;
revoke execute on function public.drying_yard_set_batch_site_readiness(uuid,uuid,uuid,uuid,boolean,boolean,boolean,boolean,numeric,numeric,text,text,text,text,text,text,text) from public,anon,authenticated;
revoke execute on function public.drying_yard_apply_batch_release(uuid,uuid,uuid,text,text,text,text,text,jsonb) from public,anon,authenticated;
grant execute on function public.drying_yard_set_batch_schedule(uuid,uuid,uuid,timestamptz,text,text,text,text,text) to service_role;
grant execute on function public.drying_yard_set_batch_site_readiness(uuid,uuid,uuid,uuid,boolean,boolean,boolean,boolean,numeric,numeric,text,text,text,text,text,text,text) to service_role;
grant execute on function public.drying_yard_apply_batch_release(uuid,uuid,uuid,text,text,text,text,text,jsonb) to service_role;
