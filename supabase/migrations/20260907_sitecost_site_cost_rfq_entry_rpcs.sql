create or replace function public.sitecost_apply_site_material_quote(
  p_project_id uuid,
  p_site_id uuid,
  p_supplier_id uuid,
  p_material_group text,
  p_quotation_ref text,
  p_valid_until date,
  p_lines jsonb,
  p_quoted_at date default current_date,
  p_payment_terms text default null,
  p_evidence_ref text default null,
  p_procurement_bid_id uuid default null,
  p_freight jsonb default null
) returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_quote_id uuid;
  v_line jsonb;
  v_line_id uuid;
  v_unit_price numeric;
  v_surcharge numeric;
  v_discount numeric;
  v_updated integer := 0;
  v_rowcount integer;
  v_freight_id uuid;
  v_summary jsonb;
begin
  if p_quotation_ref is null or btrim(p_quotation_ref) = ''
     or p_valid_until is null or p_valid_until < current_date then
    raise exception using errcode='23514', message='SITECOST_SITE_QUOTE_EVIDENCE_REQUIRED';
  end if;
  if p_lines is null or jsonb_typeof(p_lines) <> 'array' or jsonb_array_length(p_lines) = 0 then
    raise exception using errcode='23514', message='SITECOST_SITE_MATERIAL_LINES_REQUIRED';
  end if;
  if not exists (
    select 1 from public.core_installation_sites s
    where s.id=p_site_id and s.project_id=p_project_id
  ) then
    raise exception using errcode='23514', message='SITECOST_SITE_PROJECT_MISMATCH';
  end if;
  if not exists (
    select 1 from public.drying_yard_supplier_directory d
    where d.id=p_supplier_id and d.project_id=p_project_id
      and d.material_group=p_material_group
  ) then
    raise exception using errcode='23514', message='SITECOST_SITE_SUPPLIER_MATERIAL_MISMATCH';
  end if;
  if p_procurement_bid_id is not null and not exists (
    select 1 from public.drying_yard_procurement_bids b
    where b.id=p_procurement_bid_id and b.project_id=p_project_id
      and b.supplier_name is not null
  ) then
    raise exception using errcode='23514', message='SITECOST_SITE_PROCUREMENT_BID_MISMATCH';
  end if;

  insert into public.drying_yard_site_supplier_quotes(
    project_id, site_id, supplier_id, procurement_bid_id, material_group,
    quotation_ref, quoted_at, valid_until, currency, payment_terms,
    status, evidence_ref, note
  ) values (
    p_project_id, p_site_id, p_supplier_id, p_procurement_bid_id, p_material_group,
    btrim(p_quotation_ref), coalesce(p_quoted_at,current_date), p_valid_until, 'THB', p_payment_terms,
    'confirmed', coalesce(nullif(btrim(p_evidence_ref),''),btrim(p_quotation_ref)), 'Site-level RFQ price entry'
  ) returning id into v_quote_id;

  for v_line in select value from jsonb_array_elements(p_lines)
  loop
    v_line_id := nullif(v_line->>'material_cost_id','')::uuid;
    v_unit_price := nullif(v_line->>'unit_price','')::numeric;
    v_surcharge := coalesce(nullif(v_line->>'surcharge_amount','')::numeric,0);
    v_discount := coalesce(nullif(v_line->>'discount_amount','')::numeric,0);
    if v_line_id is null or v_unit_price is null or v_unit_price <= 0 or v_surcharge < 0 or v_discount < 0 then
      raise exception using errcode='23514', message='SITECOST_SITE_MATERIAL_LINE_INVALID';
    end if;

    update public.drying_yard_site_material_costs m
       set supplier_quote_id=v_quote_id,
           unit_price=v_unit_price,
           surcharge_amount=v_surcharge,
           discount_amount=v_discount,
           pricing_status='rfq_confirmed',
           effective_date=coalesce(p_quoted_at,current_date),
           valid_until=p_valid_until,
           evidence_ref=coalesce(nullif(btrim(p_evidence_ref),''),btrim(p_quotation_ref)),
           updated_at=now()
     where m.id=v_line_id
       and m.project_id=p_project_id
       and m.site_id=p_site_id
       and m.material_group=p_material_group;
    get diagnostics v_rowcount = row_count;
    if v_rowcount <> 1 then
      raise exception using errcode='23514', message='SITECOST_SITE_MATERIAL_LINE_SCOPE_MISMATCH';
    end if;
    v_updated := v_updated + 1;
  end loop;

  if p_freight is not null and jsonb_typeof(p_freight)='object' and p_freight ? 'amount' then
    if nullif(p_freight->>'amount','')::numeric < 0 then
      raise exception using errcode='23514', message='SITECOST_SITE_FREIGHT_INVALID';
    end if;
    insert into public.drying_yard_site_freight_costs(
      project_id, site_id, supplier_quote_id, material_group, origin_name,
      distance_km, vehicle_type, amount, pricing_status, valid_until, evidence_ref, note
    ) values (
      p_project_id, p_site_id, v_quote_id, p_material_group, nullif(btrim(p_freight->>'origin_name'),''),
      nullif(p_freight->>'distance_km','')::numeric, nullif(btrim(p_freight->>'vehicle_type'),''),
      nullif(p_freight->>'amount','')::numeric, 'rfq_confirmed', p_valid_until,
      coalesce(nullif(btrim(p_evidence_ref),''),btrim(p_quotation_ref)), 'Site-level RFQ freight entry'
    ) returning id into v_freight_id;
  end if;

  select to_jsonb(s) into v_summary
  from public.drying_yard_site_cost_summary_v s
  where s.project_id=p_project_id and s.site_id=p_site_id;

  return jsonb_build_object(
    'ok',true,'quote_id',v_quote_id,'updated_material_lines',v_updated,
    'freight_id',v_freight_id,'summary',v_summary
  );
end;
$$;

revoke all on function public.sitecost_apply_site_material_quote(uuid,uuid,uuid,text,text,date,jsonb,date,text,text,uuid,jsonb) from public, anon, authenticated;
grant execute on function public.sitecost_apply_site_material_quote(uuid,uuid,uuid,text,text,date,jsonb,date,text,text,uuid,jsonb) to service_role;

create or replace function public.sitecost_apply_site_rate_batch(
  p_project_id uuid,
  p_site_id uuid,
  p_rate_type text,
  p_evidence_ref text,
  p_valid_until date,
  p_lines jsonb
) returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_line jsonb;
  v_id uuid;
  v_rate numeric;
  v_mob numeric;
  v_demob numeric;
  v_updated integer := 0;
  v_rowcount integer;
  v_summary jsonb;
begin
  if p_rate_type not in ('labor','equipment') then
    raise exception using errcode='23514', message='SITECOST_SITE_RATE_TYPE_INVALID';
  end if;
  if p_evidence_ref is null or btrim(p_evidence_ref)='' or p_valid_until is null or p_valid_until < current_date then
    raise exception using errcode='23514', message='SITECOST_SITE_RATE_EVIDENCE_REQUIRED';
  end if;
  if p_lines is null or jsonb_typeof(p_lines)<>'array' or jsonb_array_length(p_lines)=0 then
    raise exception using errcode='23514', message='SITECOST_SITE_RATE_LINES_REQUIRED';
  end if;
  if not exists (select 1 from public.core_installation_sites s where s.id=p_site_id and s.project_id=p_project_id) then
    raise exception using errcode='23514', message='SITECOST_SITE_PROJECT_MISMATCH';
  end if;

  for v_line in select value from jsonb_array_elements(p_lines)
  loop
    v_id := nullif(v_line->>'cost_id','')::uuid;
    v_rate := nullif(v_line->>'unit_rate','')::numeric;
    if v_id is null or v_rate is null or v_rate <= 0 then
      raise exception using errcode='23514', message='SITECOST_SITE_RATE_LINE_INVALID';
    end if;

    if p_rate_type='labor' then
      update public.drying_yard_site_labor_costs l
         set unit_rate=v_rate, pricing_status='rfq_confirmed', valid_until=p_valid_until,
             evidence_ref=btrim(p_evidence_ref), updated_at=now()
       where l.id=v_id and l.project_id=p_project_id and l.site_id=p_site_id;
    else
      v_mob := coalesce(nullif(v_line->>'mobilization_amount','')::numeric,0);
      v_demob := coalesce(nullif(v_line->>'demobilization_amount','')::numeric,0);
      if v_mob < 0 or v_demob < 0 then
        raise exception using errcode='23514', message='SITECOST_SITE_EQUIPMENT_MOB_INVALID';
      end if;
      update public.drying_yard_site_equipment_costs e
         set unit_rate=v_rate, mobilization_amount=v_mob, demobilization_amount=v_demob,
             pricing_status='rfq_confirmed', valid_until=p_valid_until,
             evidence_ref=btrim(p_evidence_ref), updated_at=now()
       where e.id=v_id and e.project_id=p_project_id and e.site_id=p_site_id;
    end if;
    get diagnostics v_rowcount = row_count;
    if v_rowcount <> 1 then
      raise exception using errcode='23514', message='SITECOST_SITE_RATE_LINE_SCOPE_MISMATCH';
    end if;
    v_updated := v_updated + 1;
  end loop;

  select to_jsonb(s) into v_summary from public.drying_yard_site_cost_summary_v s
  where s.project_id=p_project_id and s.site_id=p_site_id;
  return jsonb_build_object('ok',true,'rate_type',p_rate_type,'updated_lines',v_updated,'summary',v_summary);
end;
$$;

revoke all on function public.sitecost_apply_site_rate_batch(uuid,uuid,text,text,date,jsonb) from public, anon, authenticated;
grant execute on function public.sitecost_apply_site_rate_batch(uuid,uuid,text,text,date,jsonb) to service_role;