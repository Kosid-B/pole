-- Kalasin pilot: ingest ND690907/001 as quoted evidence without falsely confirming site TDC.
-- Source unit prices are VAT-inclusive. Internal market-reference prices below are normalized pre-VAT by /1.07.
-- Sand and wiremesh map deterministically to BOQ units. Concrete remains spec-review only (C21/24 vs BOQ ST240).

with kalasin_sites as (
  select distinct project_id, site_id
  from public.drying_yard_site_cost_summary_v
  where province = 'กาฬสินธุ์'
), supplier_map as (
  select project_id, id as supplier_id, material_group
  from public.drying_yard_supplier_directory
  where supplier_name = 'หจก.นพดลวัสดุหนองแปน (สำนักงานใหญ่)'
    and material_group in ('CONCRETE_240KSC','AGGREGATE','STEEL_REINFORCEMENT')
)
insert into public.drying_yard_site_supplier_quotes (
  project_id, site_id, supplier_id, material_group, quotation_ref,
  quoted_at, valid_until, currency, payment_terms, status, evidence_ref, note
)
select
  ks.project_id,
  ks.site_id,
  sm.supplier_id,
  sm.material_group,
  'ND690907/001',
  date '2026-09-07',
  date '2026-09-22',
  'THB',
  'ชำระเงินก่อนส่งสินค้า',
  'quoted',
  'Supplier quotation ND690907/001 — Kalasin — 2026-09-07',
  case sm.material_group
    when 'CONCRETE_240KSC' then 'SOURCE_PRICE_VAT_INCLUSIVE=2180 THB/m3; SOURCE_SPEC=C21/24; BOQ_SPEC=ST240; SPEC_EQUIVALENCE_REQUIRED; freight/TDC not site-confirmed.'
    when 'AGGREGATE' then 'SOURCE_PRICE_VAT_INCLUSIVE=550 THB/m3 for sand; normalized pre-VAT=514.018691589 THB/m3; freight/TDC not site-confirmed.'
    when 'STEEL_REINFORCEMENT' then 'WIREMESH 4mm: 2450 THB per 2x50m roll and 1225 THB per 2x25m roll; both =24.50 THB/m2 VAT-inclusive; normalized pre-VAT=22.897196262 THB/m2; RB19 not quoted; freight/TDC not site-confirmed.'
  end
from kalasin_sites ks
join supplier_map sm on sm.project_id = ks.project_id
where not exists (
  select 1
  from public.drying_yard_site_supplier_quotes q
  where q.project_id = ks.project_id
    and q.site_id = ks.site_id
    and q.supplier_id = sm.supplier_id
    and q.material_group = sm.material_group
    and q.quotation_ref = 'ND690907/001'
);

update public.drying_yard_site_material_costs m
set unit_price = round((550::numeric / 1.07::numeric), 6),
    pricing_status = 'market_reference',
    effective_date = date '2026-09-07',
    valid_until = date '2026-09-22',
    evidence_ref = 'ND690907/001 — sand 550 THB/m3 VAT-inclusive',
    note = 'Kalasin supplier quote normalized to pre-VAT internal cost reference; site-specific freight/TDC still required; not award-ready.',
    updated_at = now()
from public.drying_yard_site_cost_summary_v s
where s.project_id = m.project_id
  and s.site_id = m.site_id
  and s.province = 'กาฬสินธุ์'
  and m.item_code = 'sand'
  and m.material_group = 'AGGREGATE';

update public.drying_yard_site_material_costs m
set unit_price = round((24.5::numeric / 1.07::numeric), 6),
    pricing_status = 'market_reference',
    effective_date = date '2026-09-07',
    valid_until = date '2026-09-22',
    evidence_ref = 'ND690907/001 — wiremesh 4mm = 24.50 THB/m2 VAT-inclusive',
    note = 'Derived deterministically from 2x50m @2450 THB and 2x25m @1225 THB; normalized pre-VAT; site-specific freight/TDC still required; RB19 excluded.',
    updated_at = now()
from public.drying_yard_site_cost_summary_v s
where s.project_id = m.project_id
  and s.site_id = m.site_id
  and s.province = 'กาฬสินธุ์'
  and m.item_code = 'wiremesh'
  and m.material_group = 'STEEL_REINFORCEMENT';

update public.drying_yard_site_material_costs m
set evidence_ref = 'ND690907/001 — C21/24 2180 THB/m3 VAT-inclusive — SPEC_EQUIVALENCE_REQUIRED vs BOQ ST240',
    note = 'Do not apply supplier concrete rate until engineering/spec equivalence C21/24 ↔ ST240 is verified. Freight/TDC also required.',
    updated_at = now()
from public.drying_yard_site_cost_summary_v s
where s.project_id = m.project_id
  and s.site_id = m.site_id
  and s.province = 'กาฬสินธุ์'
  and m.item_code = 'concrete'
  and m.material_group = 'CONCRETE_240KSC'
  and m.pricing_status = 'unconfirmed';
