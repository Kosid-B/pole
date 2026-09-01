create table public.drying_yard_supplier_invoices (
  id uuid primary key default gen_random_uuid(),
  request_id text not null unique,
  project_id uuid not null,
  supplier_bid_id uuid not null references public.drying_yard_procurement_bids(id) on delete restrict,
  supplier_name_snapshot text not null,
  invoice_ref text not null,
  tax_invoice_ref text,
  invoice_date date not null,
  net_amount numeric(16,2) not null check (net_amount > 0),
  vat_amount numeric(16,2) not null default 0 check (vat_amount >= 0),
  gross_amount numeric(16,2) not null check (gross_amount > 0),
  evidence_ref text not null,
  note text,
  status text not null default 'pending_review' check (status in ('pending_review','payment_eligible','rejected')),
  submitted_by_user_id text not null,
  submitted_by_email text not null,
  submitted_by_name text not null,
  submitted_by_role text not null check (submitted_by_role in ('EXECUTIVE','ADMIN')),
  submitted_at timestamptz not null default now(),
  constraint drying_yard_supplier_invoices_gross_check check (abs(gross_amount - (net_amount + vat_amount)) <= 0.01),
  constraint drying_yard_supplier_invoices_ref_key unique (project_id, supplier_bid_id, invoice_ref)
);

create table public.drying_yard_supplier_invoice_lines (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.drying_yard_supplier_invoices(id) on delete restrict,
  calloff_id uuid not null references public.drying_yard_supplier_calloffs(id) on delete restrict,
  batch_id uuid not null references public.drying_yard_batch_releases(id) on delete restrict,
  site_id uuid not null references public.core_installation_sites(id) on delete restrict,
  calloff_ref_snapshot text not null,
  invoiced_m3 numeric(14,3) not null check (invoiced_m3 > 0),
  tdc_per_m3_snapshot numeric(14,2) not null check (tdc_per_m3_snapshot >= 0),
  verified_accepted_m3_snapshot numeric(14,3) not null check (verified_accepted_m3_snapshot >= 0),
  expected_net_snapshot numeric(16,2) not null check (expected_net_snapshot >= 0),
  invoice_line_net numeric(16,2) not null check (invoice_line_net > 0),
  created_at timestamptz not null default now(),
  constraint drying_yard_supplier_invoice_lines_invoice_calloff_key unique (invoice_id, calloff_id)
);

create table public.drying_yard_supplier_invoice_reviews (
  id uuid primary key default gen_random_uuid(),
  request_id text not null unique,
  invoice_id uuid not null unique references public.drying_yard_supplier_invoices(id) on delete restrict,
  project_id uuid not null,
  decision text not null check (decision in ('payment_eligible','rejected')),
  match_pass boolean not null,
  match_snapshot jsonb not null,
  review_reason text not null,
  reviewed_by_user_id text not null,
  reviewed_by_email text not null,
  reviewed_by_name text not null,
  reviewed_by_role text not null check (reviewed_by_role in ('EXECUTIVE','ADMIN')),
  reviewed_at timestamptz not null default now()
);

alter table public.drying_yard_supplier_invoices enable row level security;
alter table public.drying_yard_supplier_invoice_lines enable row level security;
alter table public.drying_yard_supplier_invoice_reviews enable row level security;

revoke all on public.drying_yard_supplier_invoices from public, anon, authenticated;
revoke all on public.drying_yard_supplier_invoice_lines from public, anon, authenticated;
revoke all on public.drying_yard_supplier_invoice_reviews from public, anon, authenticated;
grant select on public.drying_yard_supplier_invoices to service_role;
grant select on public.drying_yard_supplier_invoice_lines to service_role;
grant select on public.drying_yard_supplier_invoice_reviews to service_role;

create index drying_yard_supplier_invoices_project_status_idx on public.drying_yard_supplier_invoices(project_id, status, submitted_at desc);
create index drying_yard_supplier_invoices_supplier_date_idx on public.drying_yard_supplier_invoices(supplier_bid_id, invoice_date desc);
create index drying_yard_supplier_invoice_lines_calloff_idx on public.drying_yard_supplier_invoice_lines(calloff_id, created_at desc);
create index drying_yard_supplier_invoice_lines_batch_idx on public.drying_yard_supplier_invoice_lines(batch_id);
create index drying_yard_supplier_invoice_lines_site_idx on public.drying_yard_supplier_invoice_lines(site_id);
create index drying_yard_supplier_invoice_reviews_project_idx on public.drying_yard_supplier_invoice_reviews(project_id, reviewed_at desc);

create or replace function public.drying_yard_submit_supplier_invoice(
  p_request_id text,
  p_project_id uuid,
  p_supplier_bid_id uuid,
  p_invoice_ref text,
  p_tax_invoice_ref text,
  p_invoice_date date,
  p_net_amount numeric,
  p_vat_amount numeric,
  p_gross_amount numeric,
  p_evidence_ref text,
  p_note text,
  p_lines jsonb,
  p_actor_user_id text,
  p_actor_email text,
  p_actor_name text,
  p_actor_role text
) returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_invoice_id uuid;
  v_existing_id uuid;
  v_supplier_name text;
  v_line jsonb;
  v_calloff public.drying_yard_supplier_calloffs%rowtype;
  v_qty numeric;
  v_line_net numeric;
  v_accepted numeric;
  v_reserved numeric;
  v_expected numeric;
  v_lines_net numeric := 0;
  v_line_count integer := 0;
begin
  select id into v_existing_id
  from public.drying_yard_supplier_invoices
  where request_id = p_request_id;
  if v_existing_id is not null then
    return v_existing_id;
  end if;

  if p_actor_role not in ('EXECUTIVE','ADMIN') then
    raise exception 'Only ADMIN or EXECUTIVE may submit supplier invoices';
  end if;
  if nullif(btrim(p_request_id),'') is null or nullif(btrim(p_invoice_ref),'') is null or nullif(btrim(p_evidence_ref),'') is null then
    raise exception 'request_id, invoice_ref and evidence_ref are required';
  end if;
  if p_invoice_date is null or p_invoice_date > current_date then
    raise exception 'invoice_date must be today or earlier';
  end if;
  if coalesce(p_net_amount,0) <= 0 or coalesce(p_vat_amount,0) < 0 or coalesce(p_gross_amount,0) <= 0 then
    raise exception 'Invoice amounts are invalid';
  end if;
  if abs(p_gross_amount - (p_net_amount + p_vat_amount)) > 0.01 then
    raise exception 'Gross amount must equal Net + VAT within 0.01';
  end if;
  if p_lines is null or jsonb_typeof(p_lines) <> 'array' or jsonb_array_length(p_lines) = 0 then
    raise exception 'At least one invoice line is required';
  end if;

  select nullif(btrim(supplier_name),'') into v_supplier_name
  from public.drying_yard_procurement_bids
  where id = p_supplier_bid_id and project_id = p_project_id;
  if v_supplier_name is null then
    raise exception 'Supplier bid is not valid for this project';
  end if;

  insert into public.drying_yard_supplier_invoices (
    request_id, project_id, supplier_bid_id, supplier_name_snapshot, invoice_ref, tax_invoice_ref,
    invoice_date, net_amount, vat_amount, gross_amount, evidence_ref, note, status,
    submitted_by_user_id, submitted_by_email, submitted_by_name, submitted_by_role
  ) values (
    btrim(p_request_id), p_project_id, p_supplier_bid_id, v_supplier_name, btrim(p_invoice_ref), nullif(btrim(coalesce(p_tax_invoice_ref,'')),''),
    p_invoice_date, round(p_net_amount,2), round(p_vat_amount,2), round(p_gross_amount,2), btrim(p_evidence_ref), nullif(btrim(coalesce(p_note,'')),''), 'pending_review',
    p_actor_user_id, p_actor_email, p_actor_name, p_actor_role
  ) returning id into v_invoice_id;

  for v_line in select value from jsonb_array_elements(p_lines)
  loop
    v_line_count := v_line_count + 1;
    v_qty := nullif(v_line->>'invoiced_m3','')::numeric;
    v_line_net := nullif(v_line->>'invoice_line_net','')::numeric;

    if v_qty is null or v_qty <= 0 or v_line_net is null or v_line_net <= 0 then
      raise exception 'Each invoice line requires positive invoiced_m3 and invoice_line_net';
    end if;

    select * into v_calloff
    from public.drying_yard_supplier_calloffs
    where id = nullif(v_line->>'calloff_id','')::uuid
      and project_id = p_project_id
      and supplier_bid_id = p_supplier_bid_id
    for update;

    if not found then
      raise exception 'Call-off does not belong to this project and supplier';
    end if;
    if v_calloff.status <> 'completed' then
      raise exception 'Supplier invoice requires a completed Call-off';
    end if;

    select coalesce(sum(s.accepted_m3),0) into v_accepted
    from public.drying_yard_delivery_receipt_submissions s
    join public.drying_yard_delivery_receipt_reviews r on r.submission_id = s.id and r.decision = 'accepted'
    where s.calloff_id = v_calloff.id;

    if v_accepted <= 0 then
      raise exception 'Call-off has no PM-verified accepted quantity';
    end if;

    select coalesce(sum(l.invoiced_m3),0) into v_reserved
    from public.drying_yard_supplier_invoice_lines l
    join public.drying_yard_supplier_invoices i on i.id = l.invoice_id
    where l.calloff_id = v_calloff.id
      and i.status in ('pending_review','payment_eligible');

    if v_qty > (v_accepted - v_reserved) + 0.001 then
      raise exception 'Invoice quantity exceeds unbilled PM-verified accepted quantity';
    end if;

    v_expected := round(v_qty * v_calloff.tdc_per_m3_snapshot, 2);
    v_lines_net := v_lines_net + round(v_line_net,2);

    insert into public.drying_yard_supplier_invoice_lines (
      invoice_id, calloff_id, batch_id, site_id, calloff_ref_snapshot,
      invoiced_m3, tdc_per_m3_snapshot, verified_accepted_m3_snapshot,
      expected_net_snapshot, invoice_line_net
    ) values (
      v_invoice_id, v_calloff.id, v_calloff.batch_id, v_calloff.site_id, v_calloff.calloff_ref,
      round(v_qty,3), round(v_calloff.tdc_per_m3_snapshot,2), round(v_accepted,3),
      v_expected, round(v_line_net,2)
    );
  end loop;

  if v_line_count = 0 then
    raise exception 'At least one invoice line is required';
  end if;
  if abs(round(v_lines_net,2) - round(p_net_amount,2)) > 0.01 then
    raise exception 'Invoice Net must equal the sum of invoice line Net amounts within 0.01';
  end if;

  return v_invoice_id;
end;
$$;

create or replace function public.drying_yard_review_supplier_invoice(
  p_request_id text,
  p_invoice_id uuid,
  p_decision text,
  p_review_reason text,
  p_actor_user_id text,
  p_actor_email text,
  p_actor_name text,
  p_actor_role text
) returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_review_id uuid;
  v_existing_id uuid;
  v_invoice public.drying_yard_supplier_invoices%rowtype;
  v_line record;
  v_calloff public.drying_yard_supplier_calloffs%rowtype;
  v_accepted numeric;
  v_reserved numeric;
  v_expected numeric;
  v_expected_total numeric := 0;
  v_claimed_total numeric := 0;
  v_match_pass boolean := true;
  v_match_lines jsonb := '[]'::jsonb;
  v_snapshot jsonb;
begin
  select id into v_existing_id
  from public.drying_yard_supplier_invoice_reviews
  where request_id = p_request_id;
  if v_existing_id is not null then
    return v_existing_id;
  end if;

  if p_actor_role not in ('EXECUTIVE','ADMIN') then
    raise exception 'Only ADMIN or EXECUTIVE may review supplier invoices';
  end if;
  if p_decision not in ('payment_eligible','rejected') then
    raise exception 'Decision must be payment_eligible or rejected';
  end if;
  if nullif(btrim(p_review_reason),'') is null then
    raise exception 'Review reason is required';
  end if;

  select * into v_invoice
  from public.drying_yard_supplier_invoices
  where id = p_invoice_id
  for update;
  if not found then
    raise exception 'Supplier invoice not found';
  end if;
  if v_invoice.status <> 'pending_review' then
    raise exception 'Supplier invoice is no longer pending review';
  end if;

  for v_line in
    select l.* from public.drying_yard_supplier_invoice_lines l where l.invoice_id = v_invoice.id order by l.created_at, l.id
  loop
    select * into v_calloff
    from public.drying_yard_supplier_calloffs
    where id = v_line.calloff_id;

    if not found or v_calloff.status <> 'completed' or v_calloff.project_id <> v_invoice.project_id or v_calloff.supplier_bid_id <> v_invoice.supplier_bid_id then
      v_match_pass := false;
    end if;

    select coalesce(sum(s.accepted_m3),0) into v_accepted
    from public.drying_yard_delivery_receipt_submissions s
    join public.drying_yard_delivery_receipt_reviews r on r.submission_id = s.id and r.decision = 'accepted'
    where s.calloff_id = v_line.calloff_id;

    select coalesce(sum(l2.invoiced_m3),0) into v_reserved
    from public.drying_yard_supplier_invoice_lines l2
    join public.drying_yard_supplier_invoices i2 on i2.id = l2.invoice_id
    where l2.calloff_id = v_line.calloff_id
      and i2.status in ('pending_review','payment_eligible');

    v_expected := round(v_line.invoiced_m3 * v_line.tdc_per_m3_snapshot, 2);
    v_expected_total := v_expected_total + v_expected;
    v_claimed_total := v_claimed_total + v_line.invoice_line_net;

    if abs(v_line.tdc_per_m3_snapshot - v_calloff.tdc_per_m3_snapshot) > 0.01
       or abs(v_line.invoice_line_net - v_expected) > 0.01
       or v_reserved > v_accepted + 0.001 then
      v_match_pass := false;
    end if;

    v_match_lines := v_match_lines || jsonb_build_array(jsonb_build_object(
      'calloff_id', v_line.calloff_id,
      'calloff_ref', v_line.calloff_ref_snapshot,
      'invoiced_m3', v_line.invoiced_m3,
      'verified_accepted_m3', v_accepted,
      'reserved_or_eligible_m3', v_reserved,
      'tdc_per_m3', v_line.tdc_per_m3_snapshot,
      'expected_net', v_expected,
      'invoice_line_net', v_line.invoice_line_net,
      'line_match', (abs(v_line.invoice_line_net - v_expected) <= 0.01 and v_reserved <= v_accepted + 0.001 and abs(v_line.tdc_per_m3_snapshot - v_calloff.tdc_per_m3_snapshot) <= 0.01)
    ));
  end loop;

  if abs(round(v_claimed_total,2) - v_invoice.net_amount) > 0.01
     or abs(v_invoice.gross_amount - (v_invoice.net_amount + v_invoice.vat_amount)) > 0.01
     or abs(round(v_expected_total,2) - v_invoice.net_amount) > 0.01 then
    v_match_pass := false;
  end if;

  v_snapshot := jsonb_build_object(
    'rule', 'Completed Call-off + PM-Verified Accepted Actual + Invoice Net at Call-off TDC snapshot; manual eligibility only; no auto payment',
    'match_pass', v_match_pass,
    'invoice_ref', v_invoice.invoice_ref,
    'supplier_bid_id', v_invoice.supplier_bid_id,
    'supplier_name', v_invoice.supplier_name_snapshot,
    'invoice_net', v_invoice.net_amount,
    'expected_net', round(v_expected_total,2),
    'vat_amount', v_invoice.vat_amount,
    'gross_amount', v_invoice.gross_amount,
    'lines', v_match_lines,
    'checked_at', now()
  );

  if p_decision = 'payment_eligible' and not v_match_pass then
    raise exception '3-Way Match failed; invoice cannot become payment eligible';
  end if;

  insert into public.drying_yard_supplier_invoice_reviews (
    request_id, invoice_id, project_id, decision, match_pass, match_snapshot, review_reason,
    reviewed_by_user_id, reviewed_by_email, reviewed_by_name, reviewed_by_role
  ) values (
    btrim(p_request_id), v_invoice.id, v_invoice.project_id, p_decision, v_match_pass, v_snapshot, btrim(p_review_reason),
    p_actor_user_id, p_actor_email, p_actor_name, p_actor_role
  ) returning id into v_review_id;

  update public.drying_yard_supplier_invoices
  set status = p_decision
  where id = v_invoice.id;

  return v_review_id;
end;
$$;

revoke all on function public.drying_yard_submit_supplier_invoice(text,uuid,uuid,text,text,date,numeric,numeric,numeric,text,text,jsonb,text,text,text,text) from public, anon, authenticated;
revoke all on function public.drying_yard_review_supplier_invoice(text,uuid,text,text,text,text,text,text) from public, anon, authenticated;
grant execute on function public.drying_yard_submit_supplier_invoice(text,uuid,uuid,text,text,date,numeric,numeric,numeric,text,text,jsonb,text,text,text,text) to service_role;
grant execute on function public.drying_yard_review_supplier_invoice(text,uuid,text,text,text,text,text,text) to service_role;
