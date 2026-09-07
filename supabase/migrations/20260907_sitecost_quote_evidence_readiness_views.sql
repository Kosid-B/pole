create or replace view public.drying_yard_site_quote_evidence_progress_v
with (security_invoker = true)
as
select
  q.project_id,
  q.site_id,
  count(*) filter (
    where q.status in ('quoted','confirmed')
      and q.valid_until >= current_date
      and coalesce(btrim(q.evidence_ref),'') <> ''
  ) as active_quote_evidence,
  count(distinct q.material_group) filter (
    where q.status in ('quoted','confirmed')
      and q.valid_until >= current_date
      and coalesce(btrim(q.evidence_ref),'') <> ''
  ) as active_quote_groups,
  count(*) filter (
    where q.status = 'confirmed'
      and q.valid_until >= current_date
      and coalesce(btrim(q.evidence_ref),'') <> ''
  ) as confirmed_quote_evidence,
  count(distinct q.material_group) filter (
    where q.status = 'confirmed'
      and q.valid_until >= current_date
      and coalesce(btrim(q.evidence_ref),'') <> ''
  ) as confirmed_quote_groups,
  count(*) filter (where q.status = 'expired' or q.valid_until < current_date) as expired_quote_evidence,
  min(q.valid_until) filter (
    where q.status in ('quoted','confirmed') and q.valid_until >= current_date
  ) as nearest_valid_until
from public.drying_yard_site_supplier_quotes q
group by q.project_id,q.site_id;

revoke all on public.drying_yard_site_quote_evidence_progress_v from anon, authenticated;
grant select on public.drying_yard_site_quote_evidence_progress_v to service_role;

create or replace view public.drying_yard_site_pricing_readiness_v
with (security_invoker = true)
as
with material_stats as (
  select project_id,site_id,
    count(*) filter (where pricing_status='market_reference') as market_reference_material_lines,
    count(*) filter (where pricing_status='rfq_confirmed') as confirmed_material_lines,
    count(*) filter (where pricing_status='unconfirmed') as unconfirmed_material_lines,
    count(*) filter (where coalesce(note,'') ilike '%SPEC_EQUIVALENCE_REQUIRED%' or coalesce(evidence_ref,'') ilike '%SPEC_EQUIVALENCE_REQUIRED%') as spec_review_required_lines
  from public.drying_yard_site_material_costs
  group by project_id,site_id
), labor_stats as (
  select project_id,site_id,
    count(*) filter (where pricing_status<>'rfq_confirmed') as unconfirmed_labor_lines,
    count(*) filter (where pricing_status='rfq_confirmed') as confirmed_labor_lines
  from public.drying_yard_site_labor_costs
  group by project_id,site_id
), equipment_stats as (
  select project_id,site_id,
    count(*) filter (where pricing_status<>'rfq_confirmed') as unconfirmed_equipment_lines,
    count(*) filter (where pricing_status='rfq_confirmed') as confirmed_equipment_lines
  from public.drying_yard_site_equipment_costs
  group by project_id,site_id
), freight_stats as (
  select project_id,site_id,
    count(*) as freight_lines,
    count(*) filter (where pricing_status<>'rfq_confirmed') as unconfirmed_freight_lines,
    count(*) filter (where pricing_status='rfq_confirmed') as confirmed_freight_lines
  from public.drying_yard_site_freight_costs
  group by project_id,site_id
)
select
  s.project_id,s.site_id,s.site_code,s.installation_type,s.province,s.district,s.subdistrict,
  coalesce(q.active_quote_evidence,0) as active_quote_evidence,
  coalesce(q.active_quote_groups,0) as active_quote_groups,
  coalesce(q.confirmed_quote_evidence,0) as confirmed_quote_evidence,
  coalesce(q.confirmed_quote_groups,0) as confirmed_quote_groups,
  q.nearest_valid_until,
  coalesce(m.market_reference_material_lines,0) as market_reference_material_lines,
  coalesce(m.confirmed_material_lines,0) as confirmed_material_lines,
  coalesce(m.unconfirmed_material_lines,0) as unconfirmed_material_lines,
  coalesce(m.spec_review_required_lines,0) as spec_review_required_lines,
  coalesce(l.confirmed_labor_lines,0) as confirmed_labor_lines,
  coalesce(l.unconfirmed_labor_lines,0) as unconfirmed_labor_lines,
  coalesce(e.confirmed_equipment_lines,0) as confirmed_equipment_lines,
  coalesce(e.unconfirmed_equipment_lines,0) as unconfirmed_equipment_lines,
  coalesce(f.freight_lines,0) as freight_lines,
  coalesce(f.confirmed_freight_lines,0) as confirmed_freight_lines,
  coalesce(f.unconfirmed_freight_lines,0) as unconfirmed_freight_lines,
  case
    when coalesce(m.spec_review_required_lines,0)>0 then 'HOLD_SPEC_REVIEW'
    when coalesce(m.unconfirmed_material_lines,0)>0 then 'HOLD_MATERIAL_COST'
    when coalesce(l.unconfirmed_labor_lines,0)>0 then 'HOLD_LABOR_COST'
    when coalesce(e.unconfirmed_equipment_lines,0)>0 then 'HOLD_EQUIPMENT_COST'
    when coalesce(f.freight_lines,0)=0 or coalesce(f.unconfirmed_freight_lines,0)>0 then 'HOLD_FREIGHT_TDC'
    else 'COST_EVIDENCE_READY'
  end as pricing_readiness_gate
from public.drying_yard_site_cost_summary_v s
left join public.drying_yard_site_quote_evidence_progress_v q on q.project_id=s.project_id and q.site_id=s.site_id
left join material_stats m on m.project_id=s.project_id and m.site_id=s.site_id
left join labor_stats l on l.project_id=s.project_id and l.site_id=s.site_id
left join equipment_stats e on e.project_id=s.project_id and e.site_id=s.site_id
left join freight_stats f on f.project_id=s.project_id and f.site_id=s.site_id;

revoke all on public.drying_yard_site_pricing_readiness_v from anon, authenticated;
grant select on public.drying_yard_site_pricing_readiness_v to service_role;
