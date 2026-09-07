create table if not exists public.drying_yard_dynamic_gm_policies (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null,
  province text,
  policy_name text not null,
  gm_floor numeric(5,4) not null,
  gm_standard numeric(5,4) not null,
  gm_high_risk numeric(5,4) not null,
  require_cost_confirmed boolean not null default true,
  require_min_confirmed_quotes integer not null default 2,
  require_cash_terms_confirmed boolean not null default true,
  active boolean not null default true,
  source_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint drying_yard_dynamic_gm_policies_gm_check check (
    gm_floor in (0.25,0.26,0.28,0.30,0.32)
    and gm_standard in (0.25,0.26,0.28,0.30,0.32)
    and gm_high_risk in (0.25,0.26,0.28,0.30,0.32)
    and gm_floor <= gm_standard and gm_standard <= gm_high_risk
  ),
  constraint drying_yard_dynamic_gm_policies_quotes_check check (require_min_confirmed_quotes >= 1)
);

create unique index if not exists ux_dydgp_project_scope
  on public.drying_yard_dynamic_gm_policies (project_id, coalesce(province,'__PROJECT__'))
  where active;

alter table public.drying_yard_dynamic_gm_policies enable row level security;
revoke all on public.drying_yard_dynamic_gm_policies from anon, authenticated;

insert into public.drying_yard_dynamic_gm_policies (
  project_id, province, policy_name, gm_floor, gm_standard, gm_high_risk,
  require_cost_confirmed, require_min_confirmed_quotes, require_cash_terms_confirmed, source_note
)
values
('efff9cbc-d031-4fc2-a6af-2cd870593911', null, 'Project Default Dynamic GM', 0.28, 0.30, 0.32, true, 2, true,
 'Project policy: 28% competitive floor, 30% standard, 32% high-risk. Fail closed until evidence is complete.'),
('efff9cbc-d031-4fc2-a6af-2cd870593911', 'กาฬสินธุ์', 'Kalasin Competitive Pilot', 0.25, 0.26, 0.32, true, 2, true,
 'Kalasin pilot: 25% floor only after confirmed site cost, at least two confirmed quote groups, and cash terms confirmed; otherwise risk tiers raise GM or HOLD.')
on conflict do nothing;

create table if not exists public.drying_yard_gm_scenario_references (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null,
  scope_type text not null check (scope_type in ('PROJECT','PROVINCE')),
  scope_name text not null,
  current_quote_vat numeric(18,2) not null check (current_quote_vat > 0),
  baseline_target_gm numeric(5,4) not null default 0.32,
  source_ref text not null,
  source_date date,
  approved_for_scenario boolean not null default true,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(project_id, scope_type, scope_name, source_ref)
);

alter table public.drying_yard_gm_scenario_references enable row level security;
revoke all on public.drying_yard_gm_scenario_references from anon, authenticated;

insert into public.drying_yard_gm_scenario_references
(project_id,scope_type,scope_name,current_quote_vat,baseline_target_gm,source_ref,source_date,note)
values
('efff9cbc-d031-4fc2-a6af-2cd870593911','PROJECT','446 จุด',142706437.29,0.32,'DY-446-PROP-001 V1.0',date '2026-08-30','Customer quote reference from project proposal; scenario only, not actual cost evidence.'),
('efff9cbc-d031-4fc2-a6af-2cd870593911','PROVINCE','กาฬสินธุ์',38363057.82,0.32,'DY-446-PROP-001 V1.0',date '2026-08-30','Kalasin customer quote reference: 120 sites; scenario only, not actual cost evidence.')
on conflict do nothing;

create or replace view public.drying_yard_site_dynamic_gm_v
with (security_invoker=true)
as
with quote_stats as (
  select project_id, site_id,
    count(*) filter (where status='confirmed' and valid_until >= current_date and coalesce(evidence_ref,'') <> '') as confirmed_quotes,
    count(distinct material_group) filter (where status='confirmed' and valid_until >= current_date and coalesce(evidence_ref,'') <> '') as confirmed_quote_groups
  from public.drying_yard_site_supplier_quotes
  group by project_id, site_id
), policy as (
  select s.project_id, s.site_id,
    coalesce(pp.id,pd.id) as policy_id,
    coalesce(pp.policy_name,pd.policy_name) as policy_name,
    coalesce(pp.gm_floor,pd.gm_floor,0.28) as gm_floor,
    coalesce(pp.gm_standard,pd.gm_standard,0.30) as gm_standard,
    coalesce(pp.gm_high_risk,pd.gm_high_risk,0.32) as gm_high_risk,
    coalesce(pp.require_min_confirmed_quotes,pd.require_min_confirmed_quotes,2) as min_quotes
  from public.drying_yard_site_cost_summary_v s
  left join public.drying_yard_dynamic_gm_policies pp on pp.project_id=s.project_id and pp.province=s.province and pp.active
  left join public.drying_yard_dynamic_gm_policies pd on pd.project_id=s.project_id and pd.province is null and pd.active
), base as (
  select s.*, p.policy_id,p.policy_name,p.gm_floor,p.gm_standard,p.gm_high_risk,p.min_quotes,
    coalesce(q.confirmed_quotes,0) as confirmed_quotes,
    coalesce(q.confirmed_quote_groups,0) as confirmed_quote_groups,
    c.contract_mode,c.advance_target_pct,c.client_payment_lag_days,c.retention_pct,
    c.supplier_credit_days_default,c.safety_buffer_pct,
    case when s.cost_confirmation_status <> 'CONFIRMED' then 3 else 0 end
    + case when coalesce(q.confirmed_quote_groups,0) < p.min_quotes then 2 else 0 end
    + case when c.contract_mode is null or c.contract_mode='unknown' then 1 else 0 end
    + case when coalesce(c.supplier_credit_days_default,0) < coalesce(c.client_payment_lag_days,0) then 1 else 0 end as risk_score
  from public.drying_yard_site_cost_summary_v s
  join policy p on p.project_id=s.project_id and p.site_id=s.site_id
  left join quote_stats q on q.project_id=s.project_id and q.site_id=s.site_id
  left join public.drying_yard_pm_cashflow_settings c on c.project_id=s.project_id
)
select *,
  case
    when cost_confirmation_status <> 'CONFIRMED' then gm_high_risk
    when confirmed_quote_groups < min_quotes then greatest(gm_standard,0.30)
    when contract_mode is null or contract_mode='unknown' then greatest(gm_standard,0.30)
    when coalesce(supplier_credit_days_default,0) < coalesce(client_payment_lag_days,0) then greatest(gm_standard,0.28)
    else gm_floor
  end as recommended_gm,
  case when risk_score >= 5 then 'CRITICAL' when risk_score >= 3 then 'HIGH' when risk_score >= 2 then 'MEDIUM' else 'CONTROLLED' end as financial_risk_tier,
  case
    when cost_confirmation_status <> 'CONFIRMED' then 'HOLD_COST_EVIDENCE'
    when confirmed_quote_groups < min_quotes then 'HOLD_RFQ_COVERAGE'
    when contract_mode is null or contract_mode='unknown' then 'HOLD_CASH_TERMS'
    else 'ELIGIBLE_FOR_GM_REVIEW'
  end as dynamic_gm_gate,
  case when total_site_cost is not null and total_site_cost > 0 then round(total_site_cost / (1 - (case
      when cost_confirmation_status <> 'CONFIRMED' then gm_high_risk
      when confirmed_quote_groups < min_quotes then greatest(gm_standard,0.30)
      when contract_mode is null or contract_mode='unknown' then greatest(gm_standard,0.30)
      when coalesce(supplier_credit_days_default,0) < coalesce(client_payment_lag_days,0) then greatest(gm_standard,0.28)
      else gm_floor end)),2) end as recommended_selling_price_pre_vat,
  case when total_site_cost is not null and total_site_cost > 0 then round(total_site_cost * coalesce(safety_buffer_pct,10)/100.0,2) end as modeled_safety_reserve
from base;

create or replace view public.drying_yard_gm_sensitivity_v
with (security_invoker=true)
as
with margins(gm) as (values (0.25::numeric),(0.26::numeric),(0.28::numeric),(0.30::numeric),(0.32::numeric)),
base as (
 select r.*, c.advance_target_pct,c.client_payment_lag_days,c.supplier_credit_days_default,c.safety_buffer_pct,
   round((r.current_quote_vat/1.07)*(1-r.baseline_target_gm),2) as implied_cost_pre_vat
 from public.drying_yard_gm_scenario_references r
 left join public.drying_yard_pm_cashflow_settings c on c.project_id=r.project_id
 where r.approved_for_scenario
)
select b.project_id,b.scope_type,b.scope_name,b.source_ref,b.source_date,m.gm,
 b.implied_cost_pre_vat,
 round(b.implied_cost_pre_vat/(1-m.gm),2) as selling_price_pre_vat,
 round((b.implied_cost_pre_vat/(1-m.gm))*1.07,2) as selling_price_vat,
 round((b.implied_cost_pre_vat/(1-m.gm))-b.implied_cost_pre_vat,2) as gross_profit_pre_vat,
 round(((b.implied_cost_pre_vat/(1-m.gm))-b.implied_cost_pre_vat)/b.implied_cost_pre_vat*100,2) as cost_overrun_buffer_pct_of_cost,
 round((b.implied_cost_pre_vat/(1-m.gm))-b.implied_cost_pre_vat,2) as break_even_overrun_amount,
 round(((b.implied_cost_pre_vat/(1-m.gm))*1.07)*coalesce(b.advance_target_pct,0)/100.0,2) as modeled_advance_cash_vat,
 round(b.implied_cost_pre_vat*coalesce(b.safety_buffer_pct,0)/100.0,2) as modeled_safety_reserve,
 greatest(coalesce(b.client_payment_lag_days,0)-coalesce(b.supplier_credit_days_default,0),0) as modeled_funding_gap_days,
 'SCENARIO_ONLY_IMPLIED_COST_FROM_CURRENT_QUOTE_AND_BASELINE_GM'::text as evidence_status
from base b cross join margins m;

grant select on public.drying_yard_site_dynamic_gm_v to service_role;
grant select on public.drying_yard_gm_sensitivity_v to service_role;
revoke all on public.drying_yard_site_dynamic_gm_v from anon, authenticated;
revoke all on public.drying_yard_gm_sensitivity_v from anon, authenticated;