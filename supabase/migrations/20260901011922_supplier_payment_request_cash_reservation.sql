create table if not exists public.drying_yard_supplier_payment_requests (
  id uuid primary key default gen_random_uuid(),
  request_id text not null unique,
  project_id uuid not null references public.core_projects(id) on delete restrict,
  invoice_id uuid not null references public.drying_yard_supplier_invoices(id) on delete restrict,
  supplier_bid_id uuid not null references public.drying_yard_procurement_bids(id) on delete restrict,
  supplier_name_snapshot text not null,
  invoice_ref_snapshot text not null,
  requested_gross_amount numeric(16,2) not null check (requested_gross_amount > 0),
  currency text not null default 'THB' check (currency = 'THB'),
  due_date date not null,
  evidence_ref text not null,
  request_reason text not null,
  status text not null default 'pending_approval'
    check (status in ('pending_approval','cash_reserved','rejected')),
  submitted_by_user_id text not null,
  submitted_by_email text not null,
  submitted_by_name text not null,
  submitted_by_role text not null check (submitted_by_role in ('EXECUTIVE','ADMIN')),
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.drying_yard_supplier_payment_request_reviews (
  id uuid primary key default gen_random_uuid(),
  request_id text not null unique,
  payment_request_id uuid not null unique references public.drying_yard_supplier_payment_requests(id) on delete restrict,
  project_id uuid not null references public.core_projects(id) on delete restrict,
  invoice_id uuid not null references public.drying_yard_supplier_invoices(id) on delete restrict,
  decision text not null check (decision in ('cash_reserved','rejected')),
  financial_gate_pass boolean not null,
  financial_snapshot jsonb not null,
  review_reason text not null,
  reviewed_by_user_id text not null,
  reviewed_by_email text not null,
  reviewed_by_name text not null,
  reviewed_by_role text not null check (reviewed_by_role = 'EXECUTIVE'),
  reviewed_at timestamptz not null default now()
);

create unique index if not exists drying_yard_payment_request_active_invoice_idx
  on public.drying_yard_supplier_payment_requests(invoice_id)
  where status in ('pending_approval','cash_reserved');
create index if not exists drying_yard_payment_requests_project_status_idx
  on public.drying_yard_supplier_payment_requests(project_id,status,due_date,submitted_at desc);
create index if not exists drying_yard_payment_request_reviews_project_idx
  on public.drying_yard_supplier_payment_request_reviews(project_id,reviewed_at desc);

alter table public.drying_yard_supplier_payment_requests enable row level security;
alter table public.drying_yard_supplier_payment_request_reviews enable row level security;

revoke all on table public.drying_yard_supplier_payment_requests from anon, authenticated;
revoke all on table public.drying_yard_supplier_payment_request_reviews from anon, authenticated;

create or replace function public.drying_yard_payment_review_immutable()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'PAYMENT_REQUEST_REVIEW_IMMUTABLE';
end;
$$;

drop trigger if exists drying_yard_payment_review_immutable_trigger
  on public.drying_yard_supplier_payment_request_reviews;
create trigger drying_yard_payment_review_immutable_trigger
before update or delete on public.drying_yard_supplier_payment_request_reviews
for each row execute function public.drying_yard_payment_review_immutable();

create or replace function public.drying_yard_submit_supplier_payment_request(
  p_request_id text,
  p_project_id uuid,
  p_invoice_id uuid,
  p_due_date date,
  p_evidence_ref text,
  p_request_reason text,
  p_actor_user_id text,
  p_actor_email text,
  p_actor_name text,
  p_actor_role text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_invoice public.drying_yard_supplier_invoices%rowtype;
  v_invoice_review public.drying_yard_supplier_invoice_reviews%rowtype;
  v_existing public.drying_yard_supplier_payment_requests%rowtype;
  v_id uuid;
begin
  if p_actor_role not in ('EXECUTIVE','ADMIN') then raise exception 'SUBMITTER_ROLE_BLOCK'; end if;
  if coalesce(btrim(p_request_id),'') = '' or coalesce(btrim(p_actor_user_id),'') = ''
     or coalesce(btrim(p_actor_email),'') = '' or coalesce(btrim(p_actor_name),'') = '' then
    raise exception 'ACTOR_IDENTITY_REQUIRED';
  end if;
  if p_due_date is null or coalesce(btrim(p_evidence_ref),'') = '' then
    raise exception 'PAYMENT_REQUEST_EVIDENCE_REQUIRED';
  end if;
  if length(btrim(coalesce(p_request_reason,''))) < 8 then raise exception 'REQUEST_REASON_REQUIRED'; end if;

  select * into v_existing
  from public.drying_yard_supplier_payment_requests
  where request_id = btrim(p_request_id);
  if found then
    return jsonb_build_object('ok',true,'payment_request_id',v_existing.id,'status',v_existing.status,'idempotent',true);
  end if;

  select * into v_invoice
  from public.drying_yard_supplier_invoices
  where id = p_invoice_id and project_id = p_project_id
  for update;
  if not found then raise exception 'INVOICE_NOT_FOUND'; end if;
  if v_invoice.status <> 'payment_eligible' then raise exception 'INVOICE_NOT_PAYMENT_ELIGIBLE'; end if;
  if p_due_date < v_invoice.invoice_date then raise exception 'DUE_DATE_BEFORE_INVOICE_DATE'; end if;

  select * into v_invoice_review
  from public.drying_yard_supplier_invoice_reviews
  where invoice_id = v_invoice.id and decision = 'payment_eligible' and match_pass = true;
  if not found then raise exception 'PAYMENT_ELIGIBILITY_REVIEW_NOT_FOUND'; end if;

  if exists (
    select 1 from public.drying_yard_supplier_payment_requests
    where invoice_id = v_invoice.id and status in ('pending_approval','cash_reserved')
  ) then raise exception 'ACTIVE_PAYMENT_REQUEST_EXISTS'; end if;

  insert into public.drying_yard_supplier_payment_requests(
    request_id,project_id,invoice_id,supplier_bid_id,supplier_name_snapshot,invoice_ref_snapshot,
    requested_gross_amount,due_date,evidence_ref,request_reason,
    submitted_by_user_id,submitted_by_email,submitted_by_name,submitted_by_role
  ) values (
    btrim(p_request_id),p_project_id,v_invoice.id,v_invoice.supplier_bid_id,
    v_invoice.supplier_name_snapshot,v_invoice.invoice_ref,v_invoice.gross_amount,
    p_due_date,btrim(p_evidence_ref),btrim(p_request_reason),
    btrim(p_actor_user_id),lower(btrim(p_actor_email)),btrim(p_actor_name),p_actor_role
  ) returning id into v_id;

  return jsonb_build_object(
    'ok',true,'payment_request_id',v_id,'status','pending_approval',
    'requested_gross_amount',v_invoice.gross_amount,'no_auto_pay',true
  );
end;
$$;

create or replace function public.drying_yard_review_supplier_payment_request(
  p_request_id text,
  p_payment_request_id uuid,
  p_decision text,
  p_live_forecast_gm numeric,
  p_gm_floor numeric,
  p_live_min_cash numeric,
  p_safety_reserve numeric,
  p_settings_updated_at timestamptz,
  p_financial_snapshot jsonb,
  p_review_reason text,
  p_actor_user_id text,
  p_actor_email text,
  p_actor_name text,
  p_actor_role text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_request public.drying_yard_supplier_payment_requests%rowtype;
  v_invoice public.drying_yard_supplier_invoices%rowtype;
  v_settings public.drying_yard_pm_cashflow_settings%rowtype;
  v_existing_review public.drying_yard_supplier_payment_request_reviews%rowtype;
  v_existing_reserved numeric := 0;
  v_projected_min_cash numeric := 0;
  v_gate_pass boolean := false;
  v_review_id uuid;
  v_snapshot jsonb;
begin
  if p_actor_role <> 'EXECUTIVE' then raise exception 'EXECUTIVE_REVIEW_REQUIRED'; end if;
  if p_decision not in ('cash_reserved','rejected') then raise exception 'REVIEW_DECISION_INVALID'; end if;
  if coalesce(btrim(p_request_id),'') = '' or coalesce(btrim(p_actor_user_id),'') = ''
     or coalesce(btrim(p_actor_email),'') = '' or coalesce(btrim(p_actor_name),'') = '' then
    raise exception 'ACTOR_IDENTITY_REQUIRED';
  end if;
  if length(btrim(coalesce(p_review_reason,''))) < 8 then raise exception 'REVIEW_REASON_REQUIRED'; end if;

  select * into v_existing_review
  from public.drying_yard_supplier_payment_request_reviews
  where request_id = btrim(p_request_id);
  if found then
    return jsonb_build_object('ok',true,'review_id',v_existing_review.id,'decision',v_existing_review.decision,'idempotent',true);
  end if;

  select * into v_request
  from public.drying_yard_supplier_payment_requests
  where id = p_payment_request_id
  for update;
  if not found then raise exception 'PAYMENT_REQUEST_NOT_FOUND'; end if;
  if v_request.status <> 'pending_approval' then raise exception 'PAYMENT_REQUEST_ALREADY_REVIEWED'; end if;

  select * into v_invoice
  from public.drying_yard_supplier_invoices
  where id = v_request.invoice_id and project_id = v_request.project_id
  for share;
  if not found or v_invoice.status <> 'payment_eligible' then raise exception 'INVOICE_NOT_PAYMENT_ELIGIBLE'; end if;
  if abs(v_request.requested_gross_amount - v_invoice.gross_amount) > 0.01 then
    raise exception 'PAYMENT_REQUEST_AMOUNT_MISMATCH';
  end if;

  select * into v_settings
  from public.drying_yard_pm_cashflow_settings
  where project_id = v_request.project_id
  for update;
  if not found then raise exception 'PM_CASHFLOW_SETTINGS_NOT_FOUND'; end if;
  if p_settings_updated_at is null or v_settings.updated_at <> p_settings_updated_at then
    raise exception 'FINANCIAL_MODEL_CHANGED_RETRY';
  end if;

  select coalesce(sum(requested_gross_amount),0)
  into v_existing_reserved
  from public.drying_yard_supplier_payment_requests
  where project_id = v_request.project_id and status = 'cash_reserved';

  v_projected_min_cash := p_live_min_cash - v_existing_reserved - v_request.requested_gross_amount;
  v_gate_pass := p_live_forecast_gm >= p_gm_floor
    and p_gm_floor >= 0.32
    and v_projected_min_cash >= p_safety_reserve;

  if p_decision = 'cash_reserved' and not v_gate_pass then
    raise exception 'FINANCIAL_GUARDRAIL_BLOCK';
  end if;

  v_snapshot := coalesce(p_financial_snapshot,'{}'::jsonb) || jsonb_build_object(
    'captured_at',now(),
    'forecast_gm',p_live_forecast_gm,
    'gm_floor',p_gm_floor,
    'live_min_cash_before_reservations',p_live_min_cash,
    'existing_cash_reserved',v_existing_reserved,
    'requested_gross_amount',v_request.requested_gross_amount,
    'projected_min_cash_after_reservation',v_projected_min_cash,
    'safety_reserve',p_safety_reserve,
    'settings_updated_at',v_settings.updated_at,
    'gate_pass',v_gate_pass,
    'no_auto_pay',true
  );

  update public.drying_yard_supplier_payment_requests
  set status = p_decision, reviewed_at = now()
  where id = v_request.id;

  insert into public.drying_yard_supplier_payment_request_reviews(
    request_id,payment_request_id,project_id,invoice_id,decision,financial_gate_pass,
    financial_snapshot,review_reason,reviewed_by_user_id,reviewed_by_email,
    reviewed_by_name,reviewed_by_role
  ) values (
    btrim(p_request_id),v_request.id,v_request.project_id,v_request.invoice_id,p_decision,v_gate_pass,
    v_snapshot,btrim(p_review_reason),btrim(p_actor_user_id),lower(btrim(p_actor_email)),
    btrim(p_actor_name),p_actor_role
  ) returning id into v_review_id;

  return jsonb_build_object(
    'ok',true,'review_id',v_review_id,'payment_request_id',v_request.id,
    'decision',p_decision,'financial_gate_pass',v_gate_pass,
    'projected_min_cash_after_reservation',v_projected_min_cash,
    'safety_reserve',p_safety_reserve,'no_auto_pay',true
  );
end;
$$;

revoke execute on function public.drying_yard_payment_review_immutable() from public, anon, authenticated;
revoke execute on function public.drying_yard_submit_supplier_payment_request(text,uuid,uuid,date,text,text,text,text,text,text) from public, anon, authenticated;
revoke execute on function public.drying_yard_review_supplier_payment_request(text,uuid,text,numeric,numeric,numeric,numeric,timestamptz,jsonb,text,text,text,text,text) from public, anon, authenticated;
grant execute on function public.drying_yard_submit_supplier_payment_request(text,uuid,uuid,date,text,text,text,text,text,text) to service_role;
grant execute on function public.drying_yard_review_supplier_payment_request(text,uuid,text,numeric,numeric,numeric,numeric,timestamptz,jsonb,text,text,text,text,text) to service_role;
