create table if not exists public.drying_yard_procurement_savings_scenarios (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null,
  province text not null,
  material_group text not null,
  item_code text not null,
  source_ref text not null,
  baseline_ref text not null,
  qty numeric not null check (qty >= 0),
  unit text not null,
  baseline_unit_cost_pre_vat numeric not null check (baseline_unit_cost_pre_vat >= 0),
  quoted_unit_cost_pre_vat numeric not null check (quoted_unit_cost_pre_vat >= 0),
  potential_saving_pre_vat numeric not null,
  evidence_status text not null check (evidence_status in ('market_reference','candidate_spec_review','confirmed')),
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists uq_dypss_scope_item_source
on public.drying_yard_procurement_savings_scenarios(project_id,province,item_code,source_ref);

alter table public.drying_yard_procurement_savings_scenarios enable row level security;
revoke all on public.drying_yard_procurement_savings_scenarios from anon, authenticated;
grant select,insert,update on public.drying_yard_procurement_savings_scenarios to service_role;

with project_scope as (
  select distinct project_id from public.drying_yard_site_cost_summary_v where province='กาฬสินธุ์' limit 1
), qtys as (
  select m.project_id,m.item_code,m.material_group,m.unit,sum(m.qty) as qty
  from public.drying_yard_site_material_costs m
  join public.drying_yard_site_cost_summary_v s on s.project_id=m.project_id and s.site_id=m.site_id
  where s.province='กาฬสินธุ์' and m.item_code in ('sand','wiremesh','concrete')
  group by m.project_id,m.item_code,m.material_group,m.unit
), scenario as (
  select q.project_id,'กาฬสินธุ์'::text as province,q.material_group,q.item_code,
         'ND690907/001'::text as source_ref,
         'Planning BOQ baseline — งานลานตาก 192 ตร.ม.'::text as baseline_ref,
         q.qty,q.unit,
         case q.item_code when 'sand' then 650::numeric when 'wiremesh' then 35::numeric when 'concrete' then 2400::numeric end as baseline_unit_cost_pre_vat,
         case q.item_code when 'sand' then round(550::numeric/1.07,6) when 'wiremesh' then round(24.5::numeric/1.07,6) when 'concrete' then round(2180::numeric/1.07,6) end as quoted_unit_cost_pre_vat,
         case q.item_code when 'concrete' then 'candidate_spec_review' else 'market_reference' end as evidence_status
  from qtys q join project_scope p on p.project_id=q.project_id
)
insert into public.drying_yard_procurement_savings_scenarios (
  project_id,province,material_group,item_code,source_ref,baseline_ref,qty,unit,
  baseline_unit_cost_pre_vat,quoted_unit_cost_pre_vat,potential_saving_pre_vat,evidence_status,note
)
select project_id,province,material_group,item_code,source_ref,baseline_ref,qty,unit,
       baseline_unit_cost_pre_vat,quoted_unit_cost_pre_vat,
       round((baseline_unit_cost_pre_vat-quoted_unit_cost_pre_vat)*qty,2),
       evidence_status,
       case item_code
         when 'concrete' then 'Scenario only. C21/24 must pass Material Spec Review against required ST240 before this saving may be treated as actionable.'
         else 'Scenario only. Quote price is normalized pre-VAT; site-specific freight/TDC remains required before award.'
       end
from scenario
on conflict (project_id,province,item_code,source_ref)
do update set
  qty=excluded.qty,
  baseline_unit_cost_pre_vat=excluded.baseline_unit_cost_pre_vat,
  quoted_unit_cost_pre_vat=excluded.quoted_unit_cost_pre_vat,
  potential_saving_pre_vat=excluded.potential_saving_pre_vat,
  evidence_status=excluded.evidence_status,
  note=excluded.note,
  updated_at=now();
