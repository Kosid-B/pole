create or replace function public.sitecost_review_material_spec(
  p_project_id uuid,
  p_review_id uuid,
  p_decision text,
  p_reviewed_by text,
  p_evidence_ref text,
  p_review_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_review public.drying_yard_material_spec_reviews%rowtype;
  v_updated integer := 0;
begin
  if p_decision not in ('approved','rejected') then
    raise exception using errcode='23514', message='SITECOST_SPEC_REVIEW_INVALID_DECISION';
  end if;
  if coalesce(btrim(p_reviewed_by),'')='' or coalesce(btrim(p_evidence_ref),'')='' then
    raise exception using errcode='23514', message='SITECOST_SPEC_REVIEW_EVIDENCE_REQUIRED';
  end if;

  select * into v_review
  from public.drying_yard_material_spec_reviews
  where id=p_review_id and project_id=p_project_id
  for update;

  if not found then
    raise exception using errcode='P0002', message='SITECOST_SPEC_REVIEW_NOT_FOUND';
  end if;

  update public.drying_yard_material_spec_reviews
  set review_status=p_decision,
      reviewed_by=btrim(p_reviewed_by),
      reviewed_at=now(),
      evidence_ref=p_evidence_ref,
      review_note=coalesce(p_review_note,review_note),
      updated_at=now()
  where id=p_review_id;

  if p_decision='approved'
     and v_review.province='กาฬสินธุ์'
     and v_review.material_group='CONCRETE_240KSC'
     and v_review.quotation_ref='ND690907/001' then
    update public.drying_yard_site_material_costs m
    set unit_price=round(2180::numeric/1.07,6),
        pricing_status='market_reference',
        effective_date=date '2026-09-07',
        valid_until=date '2026-09-22',
        evidence_ref=p_evidence_ref,
        note='Spec review approved for C21/24 versus required ST240. Supplier quote normalized pre-VAT. Site-specific freight/TDC still required; not rfq_confirmed.',
        updated_at=now()
    from public.drying_yard_site_cost_summary_v s
    where s.project_id=m.project_id
      and s.site_id=m.site_id
      and m.project_id=p_project_id
      and s.province='กาฬสินธุ์'
      and m.item_code='concrete'
      and m.material_group='CONCRETE_240KSC'
      and m.pricing_status='unconfirmed';
    get diagnostics v_updated = row_count;
  end if;

  return jsonb_build_object(
    'ok',true,
    'review_id',p_review_id,
    'decision',p_decision,
    'updated_concrete_lines',v_updated,
    'commercial_effect','market_reference_only',
    'award_gate','UNCHANGED_UNTIL_FREIGHT_TDC_AND_REMAINING_COST_EVIDENCE_CONFIRMED'
  );
end;
$$;

revoke all on function public.sitecost_review_material_spec(uuid,uuid,text,text,text,text) from public, anon, authenticated;
grant execute on function public.sitecost_review_material_spec(uuid,uuid,text,text,text,text) to service_role;
