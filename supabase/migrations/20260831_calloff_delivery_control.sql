create table if not exists public.drying_yard_supplier_calloffs (
  id uuid primary key default gen_random_uuid(),
  request_id text not null unique,
  project_id uuid not null,
  batch_id uuid not null references public.drying_yard_batch_releases(id) on delete restrict,
  site_id uuid not null references public.core_installation_sites(id) on delete restrict,
  framework_id uuid not null references public.drying_yard_framework_agreements(id) on delete restrict,
  supplier_bid_id uuid not null references public.drying_yard_procurement_bids(id) on delete restrict,
  supplier_role text not null check (supplier_role in ('primary','backup')),
  calloff_ref text not null,
  requested_m3 numeric not null check (requested_m3 > 0),
  planned_delivery_at timestamptz not null,
  tdc_per_m3_snapshot numeric not null check (tdc_per_m3_snapshot >= 0),
  quotation_ref_snapshot text,
  payment_terms_snapshot text,
  status text not null default 'confirmed' check (status in ('confirmed','completed','cancelled')),
  gate_snapshot jsonb not null default '{}'::jsonb,
  created_by_user_id text not null,
  created_by_email text not null,
  created_by_name text not null,
  created_by_role text not null check (created_by_role in ('EXECUTIVE','ADMIN')),
  create_reason text not null,
  created_at timestamptz not null default now(),
  closed_by_user_id text,
  closed_by_email text,
  closed_by_name text,
  closed_by_role text,
  close_reason text,
  closed_at timestamptz,
  unique (project_id, calloff_ref)
);

create index if not exists idx_drying_yard_supplier_calloffs_batch on public.drying_yard_supplier_calloffs(batch_id, status);
create index if not exists idx_drying_yard_supplier_calloffs_site on public.drying_yard_supplier_calloffs(site_id, status);

create table if not exists public.drying_yard_delivery_receipt_submissions (
  id uuid primary key default gen_random_uuid(),
  request_id text not null unique,
  project_id uuid not null,
  calloff_id uuid not null references public.drying_yard_supplier_calloffs(id) on delete restrict,
  batch_id uuid not null references public.drying_yard_batch_releases(id) on delete restrict,
  site_id uuid not null references public.core_installation_sites(id) on delete restrict,
  do_ref text not null,
  truck_no text,
  delivered_m3 numeric not null check (delivered_m3 > 0),
  accepted_m3 numeric not null check (accepted_m3 >= 0),
  rejected_m3 numeric not null check (rejected_m3 >= 0),
  qa_status text not null check (qa_status in ('accepted','partial','rejected')),
  slump_mm numeric,
  concrete_temp_c numeric,
  cube_sample_ref text,
  evidence_ref text not null,
  note text,
  submitted_by_user_id text not null,
  submitted_by_email text not null,
  submitted_by_name text not null,
  submitted_by_role text not null check (submitted_by_role in ('EXECUTIVE','ADMIN','FIELD_LEADER')),
  submitted_at timestamptz not null default now(),
  unique (calloff_id, do_ref),
  check (abs(delivered_m3 - (accepted_m3 + rejected_m3)) <= 0.01)
);

create index if not exists idx_drying_yard_delivery_receipts_calloff on public.drying_yard_delivery_receipt_submissions(calloff_id, submitted_at desc);
create index if not exists idx_drying_yard_delivery_receipts_site on public.drying_yard_delivery_receipt_submissions(site_id, submitted_at desc);

create table if not exists public.drying_yard_delivery_receipt_reviews (
  id uuid primary key default gen_random_uuid(),
  request_id text not null unique,
  project_id uuid not null,
  submission_id uuid not null unique references public.drying_yard_delivery_receipt_submissions(id) on delete restrict,
  calloff_id uuid not null references public.drying_yard_supplier_calloffs(id) on delete restrict,
  batch_id uuid not null references public.drying_yard_batch_releases(id) on delete restrict,
  site_id uuid not null references public.core_installation_sites(id) on delete restrict,
  decision text not null check (decision in ('accepted','rejected')),
  reviewed_by_user_id text not null,
  reviewed_by_email text not null,
  reviewed_by_name text not null,
  reviewed_by_role text not null check (reviewed_by_role in ('EXECUTIVE','ADMIN')),
  review_reason text not null,
  reviewed_at timestamptz not null default now()
);

create index if not exists idx_drying_yard_delivery_reviews_calloff on public.drying_yard_delivery_receipt_reviews(calloff_id, reviewed_at desc);

create table if not exists public.drying_yard_calloff_audit (
  id uuid primary key default gen_random_uuid(),
  request_id text not null unique,
  project_id uuid not null,
  calloff_id uuid not null references public.drying_yard_supplier_calloffs(id) on delete restrict,
  action text not null check (action in ('created','completed','cancelled')),
  actor_user_id text not null,
  actor_email text not null,
  actor_name text not null,
  actor_role text not null check (actor_role in ('EXECUTIVE','ADMIN')),
  reason text not null,
  snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.drying_yard_supplier_calloffs enable row level security;
alter table public.drying_yard_delivery_receipt_submissions enable row level security;
alter table public.drying_yard_delivery_receipt_reviews enable row level security;
alter table public.drying_yard_calloff_audit enable row level security;

revoke all on table public.drying_yard_supplier_calloffs from public, anon, authenticated;
revoke all on table public.drying_yard_delivery_receipt_submissions from public, anon, authenticated;
revoke all on table public.drying_yard_delivery_receipt_reviews from public, anon, authenticated;
revoke all on table public.drying_yard_calloff_audit from public, anon, authenticated;
grant all on table public.drying_yard_supplier_calloffs to service_role;
grant all on table public.drying_yard_delivery_receipt_submissions to service_role;
grant all on table public.drying_yard_delivery_receipt_reviews to service_role;
grant all on table public.drying_yard_calloff_audit to service_role;

create or replace function public.drying_yard_delivery_immutable()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  raise exception 'APPEND_ONLY_RECORD';
end;
$$;

create trigger drying_yard_delivery_submission_immutable
before update or delete on public.drying_yard_delivery_receipt_submissions
for each row execute function public.drying_yard_delivery_immutable();

create trigger drying_yard_delivery_review_immutable
before update or delete on public.drying_yard_delivery_receipt_reviews
for each row execute function public.drying_yard_delivery_immutable();

create trigger drying_yard_calloff_audit_immutable
before update or delete on public.drying_yard_calloff_audit
for each row execute function public.drying_yard_delivery_immutable();

create or replace function public.drying_yard_create_supplier_calloff(
  p_request_id text,
  p_project_id uuid,
  p_batch_id uuid,
  p_site_id uuid,
  p_supplier_bid_id uuid,
  p_calloff_ref text,
  p_requested_m3 numeric,
  p_planned_delivery_at timestamptz,
  p_actor_user_id text,
  p_actor_email text,
  p_actor_name text,
  p_actor_role text,
  p_reason text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_batch public.drying_yard_batch_releases%rowtype;
  v_site public.drying_yard_batch_release_sites%rowtype;
  v_framework public.drying_yard_framework_agreements%rowtype;
  v_bid public.drying_yard_procurement_bids%rowtype;
  v_supplier_role text;
  v_tdc numeric;
  v_reserved numeric := 0;
  v_remaining numeric := 0;
  v_calloff_id uuid;
  v_snapshot jsonb;
begin
  if p_actor_role not in ('EXECUTIVE','ADMIN') then raise exception 'APPROVER_ROLE_BLOCK'; end if;
  if coalesce(trim(p_request_id),'') = '' or coalesce(trim(p_calloff_ref),'') = '' then raise exception 'CALLOFF_REFERENCE_REQUIRED'; end if;
  if coalesce(trim(p_actor_user_id),'') = '' or coalesce(trim(p_actor_email),'') = '' or coalesce(trim(p_actor_name),'') = '' then raise exception 'ACTOR_IDENTITY_REQUIRED'; end if;
  if length(trim(coalesce(p_reason,''))) < 8 then raise exception 'REASON_REQUIRED'; end if;
  if p_requested_m3 is null or p_requested_m3 <= 0 then raise exception 'CALLOFF_QUANTITY_INVALID'; end if;

  select * into v_batch from public.drying_yard_batch_releases where id = p_batch_id and project_id = p_project_id for update;
  if not found then raise exception 'BATCH_NOT_FOUND'; end if;
  if v_batch.status not in ('released','in_progress') then raise exception 'BATCH_NOT_RELEASED'; end if;

  select * into v_site from public.drying_yard_batch_release_sites where batch_id = p_batch_id and site_id = p_site_id;
  if not found then raise exception 'SITE_NOT_IN_BATCH'; end if;
  if v_site.readiness_status not in ('ready','released','completed') or coalesce(v_site.confirmed_concrete_m3,0) <= 0 then raise exception 'SITE_NOT_VERIFIED_READY'; end if;

  select * into v_framework from public.drying_yard_framework_agreements where project_id = p_project_id and cluster_id = v_batch.cluster_id and status = 'active';
  if not found then raise exception 'ACTIVE_FRAMEWORK_REQUIRED'; end if;
  if coalesce(trim(v_framework.agreement_no),'') = '' then raise exception 'FRAMEWORK_AGREEMENT_NUMBER_REQUIRED'; end if;
  if v_framework.effective_from is null or p_planned_delivery_at::date < v_framework.effective_from or (v_framework.effective_to is not null and p_planned_delivery_at::date > v_framework.effective_to) then raise exception 'DELIVERY_OUTSIDE_FRAMEWORK_PERIOD'; end if;
  if p_planned_delivery_at < now() + make_interval(hours => greatest(0, v_framework.calloff_notice_hours)) then raise exception 'CALLOFF_NOTICE_NOT_MET'; end if;

  if p_supplier_bid_id = v_framework.primary_bid_id then v_supplier_role := 'primary';
  elsif p_supplier_bid_id = v_framework.backup_bid_id then v_supplier_role := 'backup';
  else raise exception 'SUPPLIER_NOT_FRAMEWORK_PRIMARY_OR_BACKUP';
  end if;

  select * into v_bid from public.drying_yard_procurement_bids where id = p_supplier_bid_id and project_id = p_project_id and cluster_id = v_batch.cluster_id;
  if not found then raise exception 'SUPPLIER_BID_NOT_FOUND'; end if;
  if v_bid.bid_status <> 'confirmed' then raise exception 'SUPPLIER_BID_NOT_CONFIRMED'; end if;
  if v_bid.valid_until is null or v_bid.valid_until < p_planned_delivery_at::date then raise exception 'SUPPLIER_QUOTE_EXPIRED_FOR_DELIVERY'; end if;

  v_tdc := coalesce(v_bid.base_rate,0) + coalesce(v_bid.freight_per_m3,0) + coalesce(v_bid.pump_per_m3,0) + coalesce(v_bid.waiting_per_m3,0) + coalesce(v_bid.short_load_per_m3,0) - coalesce(v_bid.cash_discount_per_m3,0) - coalesce(v_bid.volume_rebate_per_m3,0) - coalesce(v_bid.schedule_discount_per_m3,0) + coalesce(v_bid.other_adjustment_per_m3,0);
  if v_tdc <= 0 then raise exception 'TDC_INVALID'; end if;

  select coalesce(sum(
    case when c.status = 'confirmed' then c.requested_m3
    else coalesce((select sum(s.accepted_m3) from public.drying_yard_delivery_receipt_submissions s join public.drying_yard_delivery_receipt_reviews r on r.submission_id = s.id and r.decision = 'accepted' where s.calloff_id = c.id),0)
    end
  ),0) into v_reserved
  from public.drying_yard_supplier_calloffs c
  where c.project_id = p_project_id and c.site_id = p_site_id;

  v_remaining := coalesce(v_site.confirmed_concrete_m3,0) - v_reserved;
  if p_requested_m3 > v_remaining + 0.01 then raise exception 'CALLOFF_EXCEEDS_VERIFIED_REMAINING_QUANTITY'; end if;

  v_snapshot := jsonb_build_object(
    'captured_at', now(), 'batch_id', v_batch.id, 'batch_code', v_batch.batch_code, 'batch_status', v_batch.status,
    'site_id', v_site.site_id, 'verified_concrete_m3', v_site.confirmed_concrete_m3,
    'reserved_or_verified_actual_m3', v_reserved, 'remaining_before_calloff_m3', v_remaining,
    'framework_id', v_framework.id, 'agreement_no', v_framework.agreement_no,
    'supplier_bid_id', v_bid.id, 'supplier_name', v_bid.supplier_name, 'supplier_role', v_supplier_role,
    'quotation_ref', v_bid.quotation_ref, 'quote_valid_until', v_bid.valid_until,
    'tdc_per_m3', v_tdc, 'calloff_notice_hours', v_framework.calloff_notice_hours, 'planned_delivery_at', p_planned_delivery_at
  );

  insert into public.drying_yard_supplier_calloffs(
    request_id, project_id, batch_id, site_id, framework_id, supplier_bid_id, supplier_role, calloff_ref,
    requested_m3, planned_delivery_at, tdc_per_m3_snapshot, quotation_ref_snapshot, payment_terms_snapshot,
    status, gate_snapshot, created_by_user_id, created_by_email, created_by_name, created_by_role, create_reason
  ) values (
    trim(p_request_id), p_project_id, p_batch_id, p_site_id, v_framework.id, p_supplier_bid_id, v_supplier_role, trim(p_calloff_ref),
    p_requested_m3, p_planned_delivery_at, v_tdc, v_bid.quotation_ref, v_bid.payment_terms,
    'confirmed', v_snapshot, trim(p_actor_user_id), lower(trim(p_actor_email)), trim(p_actor_name), p_actor_role, trim(p_reason)
  ) returning id into v_calloff_id;

  insert into public.drying_yard_calloff_audit(request_id, project_id, calloff_id, action, actor_user_id, actor_email, actor_name, actor_role, reason, snapshot)
  values (trim(p_request_id) || ':audit', p_project_id, v_calloff_id, 'created', trim(p_actor_user_id), lower(trim(p_actor_email)), trim(p_actor_name), p_actor_role, trim(p_reason), v_snapshot);

  return jsonb_build_object('ok', true, 'calloff_id', v_calloff_id, 'supplier_role', v_supplier_role, 'requested_m3', p_requested_m3, 'remaining_after_m3', v_remaining - p_requested_m3, 'tdc_per_m3', v_tdc, 'status', 'confirmed');
end;
$$;

create or replace function public.drying_yard_submit_delivery_receipt(
  p_request_id text, p_project_id uuid, p_calloff_id uuid, p_do_ref text, p_truck_no text,
  p_delivered_m3 numeric, p_accepted_m3 numeric, p_rejected_m3 numeric, p_slump_mm numeric, p_concrete_temp_c numeric,
  p_cube_sample_ref text, p_evidence_ref text, p_note text,
  p_submitted_by_user_id text, p_submitted_by_email text, p_submitted_by_name text, p_submitted_by_role text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_calloff public.drying_yard_supplier_calloffs%rowtype;
  v_batch public.drying_yard_batch_releases%rowtype;
  v_qa text;
  v_id uuid;
begin
  if p_submitted_by_role not in ('EXECUTIVE','ADMIN','FIELD_LEADER') then raise exception 'SUBMITTER_ROLE_BLOCK'; end if;
  if coalesce(trim(p_request_id),'') = '' or coalesce(trim(p_do_ref),'') = '' or coalesce(trim(p_evidence_ref),'') = '' then raise exception 'DELIVERY_EVIDENCE_REQUIRED'; end if;
  if coalesce(trim(p_submitted_by_user_id),'') = '' or coalesce(trim(p_submitted_by_email),'') = '' or coalesce(trim(p_submitted_by_name),'') = '' then raise exception 'ACTOR_IDENTITY_REQUIRED'; end if;
  if p_delivered_m3 is null or p_delivered_m3 <= 0 or p_accepted_m3 is null or p_accepted_m3 < 0 or p_rejected_m3 is null or p_rejected_m3 < 0 then raise exception 'DELIVERY_QUANTITY_INVALID'; end if;
  if abs(p_delivered_m3 - (p_accepted_m3 + p_rejected_m3)) > 0.01 then raise exception 'DELIVERY_RECONCILIATION_MISMATCH'; end if;

  select * into v_calloff from public.drying_yard_supplier_calloffs where id = p_calloff_id and project_id = p_project_id;
  if not found then raise exception 'CALLOFF_NOT_FOUND'; end if;
  if v_calloff.status <> 'confirmed' then raise exception 'CALLOFF_NOT_OPEN'; end if;

  select * into v_batch from public.drying_yard_batch_releases where id = v_calloff.batch_id and project_id = p_project_id;
  if not found or v_batch.status not in ('released','in_progress') then raise exception 'BATCH_NOT_ACTIVE_FOR_DELIVERY'; end if;

  if p_accepted_m3 = 0 then v_qa := 'rejected'; elsif p_rejected_m3 > 0 then v_qa := 'partial'; else v_qa := 'accepted'; end if;

  insert into public.drying_yard_delivery_receipt_submissions(
    request_id, project_id, calloff_id, batch_id, site_id, do_ref, truck_no, delivered_m3, accepted_m3, rejected_m3,
    qa_status, slump_mm, concrete_temp_c, cube_sample_ref, evidence_ref, note,
    submitted_by_user_id, submitted_by_email, submitted_by_name, submitted_by_role
  ) values (
    trim(p_request_id), p_project_id, v_calloff.id, v_calloff.batch_id, v_calloff.site_id, trim(p_do_ref), nullif(trim(coalesce(p_truck_no,'')),''),
    p_delivered_m3, p_accepted_m3, p_rejected_m3, v_qa, p_slump_mm, p_concrete_temp_c,
    nullif(trim(coalesce(p_cube_sample_ref,'')),''), trim(p_evidence_ref), nullif(trim(coalesce(p_note,'')),''),
    trim(p_submitted_by_user_id), lower(trim(p_submitted_by_email)), trim(p_submitted_by_name), p_submitted_by_role
  ) returning id into v_id;

  return jsonb_build_object('ok', true, 'submission_id', v_id, 'qa_status', v_qa, 'review_status', 'pending');
end;
$$;

create or replace function public.drying_yard_review_delivery_receipt(
  p_request_id text, p_project_id uuid, p_submission_id uuid, p_decision text,
  p_reviewed_by_user_id text, p_reviewed_by_email text, p_reviewed_by_name text, p_reviewed_by_role text, p_review_reason text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_submission public.drying_yard_delivery_receipt_submissions%rowtype;
  v_id uuid;
begin
  if p_reviewed_by_role not in ('EXECUTIVE','ADMIN') then raise exception 'REVIEWER_ROLE_BLOCK'; end if;
  if p_decision not in ('accepted','rejected') then raise exception 'REVIEW_DECISION_INVALID'; end if;
  if coalesce(trim(p_request_id),'') = '' or coalesce(trim(p_reviewed_by_user_id),'') = '' or coalesce(trim(p_reviewed_by_email),'') = '' or coalesce(trim(p_reviewed_by_name),'') = '' then raise exception 'ACTOR_IDENTITY_REQUIRED'; end if;
  if length(trim(coalesce(p_review_reason,''))) < 8 then raise exception 'REVIEW_REASON_REQUIRED'; end if;

  select * into v_submission from public.drying_yard_delivery_receipt_submissions where id = p_submission_id and project_id = p_project_id;
  if not found then raise exception 'DELIVERY_SUBMISSION_NOT_FOUND'; end if;
  if exists(select 1 from public.drying_yard_delivery_receipt_reviews where submission_id = p_submission_id) then raise exception 'DELIVERY_ALREADY_REVIEWED'; end if;

  insert into public.drying_yard_delivery_receipt_reviews(
    request_id, project_id, submission_id, calloff_id, batch_id, site_id, decision,
    reviewed_by_user_id, reviewed_by_email, reviewed_by_name, reviewed_by_role, review_reason
  ) values (
    trim(p_request_id), p_project_id, v_submission.id, v_submission.calloff_id, v_submission.batch_id, v_submission.site_id, p_decision,
    trim(p_reviewed_by_user_id), lower(trim(p_reviewed_by_email)), trim(p_reviewed_by_name), p_reviewed_by_role, trim(p_review_reason)
  ) returning id into v_id;

  return jsonb_build_object('ok', true, 'review_id', v_id, 'submission_id', v_submission.id, 'decision', p_decision, 'verified_accepted_m3', case when p_decision = 'accepted' then v_submission.accepted_m3 else 0 end);
end;
$$;

create or replace function public.drying_yard_close_supplier_calloff(
  p_request_id text, p_project_id uuid, p_calloff_id uuid, p_status text,
  p_actor_user_id text, p_actor_email text, p_actor_name text, p_actor_role text, p_reason text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_calloff public.drying_yard_supplier_calloffs%rowtype;
  v_pending integer;
  v_verified_accepted numeric;
  v_verified_rejected numeric;
  v_snapshot jsonb;
begin
  if p_actor_role not in ('EXECUTIVE','ADMIN') then raise exception 'APPROVER_ROLE_BLOCK'; end if;
  if p_status not in ('completed','cancelled') then raise exception 'CALLOFF_CLOSE_STATUS_INVALID'; end if;
  if coalesce(trim(p_request_id),'') = '' or coalesce(trim(p_actor_user_id),'') = '' or coalesce(trim(p_actor_email),'') = '' or coalesce(trim(p_actor_name),'') = '' then raise exception 'ACTOR_IDENTITY_REQUIRED'; end if;
  if length(trim(coalesce(p_reason,''))) < 8 then raise exception 'REASON_REQUIRED'; end if;

  select * into v_calloff from public.drying_yard_supplier_calloffs where id = p_calloff_id and project_id = p_project_id for update;
  if not found then raise exception 'CALLOFF_NOT_FOUND'; end if;
  if v_calloff.status <> 'confirmed' then raise exception 'CALLOFF_ALREADY_CLOSED'; end if;

  select count(*) into v_pending from public.drying_yard_delivery_receipt_submissions s
  where s.calloff_id = v_calloff.id and not exists(select 1 from public.drying_yard_delivery_receipt_reviews r where r.submission_id = s.id);
  if v_pending > 0 then raise exception 'DELIVERY_REVIEW_PENDING'; end if;

  select coalesce(sum(case when r.decision = 'accepted' then s.accepted_m3 else 0 end),0),
         coalesce(sum(case when r.decision = 'accepted' then s.rejected_m3 else 0 end),0)
    into v_verified_accepted, v_verified_rejected
  from public.drying_yard_delivery_receipt_submissions s
  join public.drying_yard_delivery_receipt_reviews r on r.submission_id = s.id
  where s.calloff_id = v_calloff.id;

  if p_status = 'completed' and v_verified_accepted <= 0 then raise exception 'NO_VERIFIED_ACCEPTED_DELIVERY'; end if;

  v_snapshot := jsonb_build_object('captured_at',now(),'calloff_id',v_calloff.id,'calloff_ref',v_calloff.calloff_ref,'requested_m3',v_calloff.requested_m3,'verified_accepted_m3',v_verified_accepted,'verified_rejected_m3',v_verified_rejected,'new_status',p_status);

  update public.drying_yard_supplier_calloffs set status = p_status, closed_by_user_id = trim(p_actor_user_id), closed_by_email = lower(trim(p_actor_email)), closed_by_name = trim(p_actor_name), closed_by_role = p_actor_role, close_reason = trim(p_reason), closed_at = now() where id = v_calloff.id;

  insert into public.drying_yard_calloff_audit(request_id, project_id, calloff_id, action, actor_user_id, actor_email, actor_name, actor_role, reason, snapshot)
  values(trim(p_request_id), p_project_id, v_calloff.id, p_status, trim(p_actor_user_id), lower(trim(p_actor_email)), trim(p_actor_name), p_actor_role, trim(p_reason), v_snapshot);

  return jsonb_build_object('ok',true,'calloff_id',v_calloff.id,'status',p_status,'verified_accepted_m3',v_verified_accepted,'verified_rejected_m3',v_verified_rejected);
end;
$$;

revoke execute on function public.drying_yard_delivery_immutable() from public, anon, authenticated;
revoke execute on function public.drying_yard_create_supplier_calloff(text,uuid,uuid,uuid,uuid,text,numeric,timestamptz,text,text,text,text,text) from public, anon, authenticated;
revoke execute on function public.drying_yard_submit_delivery_receipt(text,uuid,uuid,text,text,numeric,numeric,numeric,numeric,numeric,text,text,text,text,text,text,text) from public, anon, authenticated;
revoke execute on function public.drying_yard_review_delivery_receipt(text,uuid,uuid,text,text,text,text,text,text) from public, anon, authenticated;
revoke execute on function public.drying_yard_close_supplier_calloff(text,uuid,uuid,text,text,text,text,text,text) from public, anon, authenticated;
grant execute on function public.drying_yard_create_supplier_calloff(text,uuid,uuid,uuid,uuid,text,numeric,timestamptz,text,text,text,text,text) to service_role;
grant execute on function public.drying_yard_submit_delivery_receipt(text,uuid,uuid,text,text,numeric,numeric,numeric,numeric,numeric,text,text,text,text,text,text,text) to service_role;
grant execute on function public.drying_yard_review_delivery_receipt(text,uuid,uuid,text,text,text,text,text,text) to service_role;
grant execute on function public.drying_yard_close_supplier_calloff(text,uuid,uuid,text,text,text,text,text,text) to service_role;
