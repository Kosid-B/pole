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
  if p_invoice_date is null or p_invoice_date > (now() at time zone 'Asia/Bangkok')::date then
    raise exception 'invoice_date must be today or earlier in Asia/Bangkok';
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

revoke all on function public.drying_yard_submit_supplier_invoice(text,uuid,uuid,text,text,date,numeric,numeric,numeric,text,text,jsonb,text,text,text,text) from public, anon, authenticated;
grant execute on function public.drying_yard_submit_supplier_invoice(text,uuid,uuid,text,text,date,numeric,numeric,numeric,text,text,jsonb,text,text,text,text) to service_role;
