-- SiteCost 446: site-specific bottom-up cost model.
-- No averaged prices are written by this migration. Confirmed prices require evidence.

create table if not exists public.drying_yard_site_supplier_quotes (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.core_projects(id) on delete cascade,
  site_id uuid not null references public.core_installation_sites(id) on delete cascade,
  supplier_id uuid references public.drying_yard_supplier_directory(id) on delete restrict,
  procurement_bid_id uuid references public.drying_yard_procurement_bids(id) on delete restrict,
  material_group text not null,
  quotation_ref text,
  quoted_at date,
  valid_until date,
  currency text not null default 'THB',
  payment_terms text,
  status text not null default 'draft' check (status in ('draft','quoted','confirmed','expired','rejected')),
  evidence_ref text,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint drying_yard_site_supplier_quotes_confirmed_evidence_ck check (
    status <> 'confirmed' or (
      supplier_id is not null and
      quotation_ref is not null and btrim(quotation_ref) <> '' and
      valid_until is not null
    )
  )
);

create table if not exists public.drying_yard_site_material_costs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.core_projects(id) on delete cascade,
  site_id uuid not null references public.core_installation_sites(id) on delete cascade,
  boq_item_id uuid references public.drying_yard_boq_items(id) on delete restrict,
  supplier_quote_id uuid references public.drying_yard_site_supplier_quotes(id) on delete restrict,
  item_code text not null,
  material_group text not null,
  item_name text not null,
  qty numeric not null check (qty >= 0),
  unit text not null,
  unit_price numeric check (unit_price is null or unit_price >= 0),
  surcharge_amount numeric not null default 0 check (surcharge_amount >= 0),
  discount_amount numeric not null default 0 check (discount_amount >= 0),
  pricing_status text not null default 'unconfirmed' check (pricing_status in ('unconfirmed','market_reference','rfq_confirmed')),
  effective_date date,
  valid_until date,
  evidence_ref text,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint drying_yard_site_material_costs_rfq_evidence_ck check (
    pricing_status <> 'rfq_confirmed' or (
      supplier_quote_id is not null and unit_price is not null and unit_price > 0 and valid_until is not null
    )
  ),
  constraint drying_yard_site_material_costs_unique_boq unique (site_id, boq_item_id)
);

create table if not exists public.drying_yard_site_freight_costs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.core_projects(id) on delete cascade,
  site_id uuid not null references public.core_installation_sites(id) on delete cascade,
  supplier_quote_id uuid references public.drying_yard_site_supplier_quotes(id) on delete restrict,
  material_cost_id uuid references public.drying_yard_site_material_costs(id) on delete restrict,
  material_group text,
  origin_name text,
  distance_km numeric check (distance_km is null or distance_km >= 0),
  vehicle_type text,
  amount numeric check (amount is null or amount >= 0),
  pricing_status text not null default 'unconfirmed' check (pricing_status in ('unconfirmed','market_reference','rfq_confirmed')),
  valid_until date,
  evidence_ref text,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint drying_yard_site_freight_costs_rfq_evidence_ck check (
    pricing_status <> 'rfq_confirmed' or (supplier_quote_id is not null and amount is not null and valid_until is not null)
  )
);

create table if not exists public.drying_yard_site_equipment_costs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.core_projects(id) on delete cascade,
  site_id uuid not null references public.core_installation_sites(id) on delete cascade,
  equipment_code text,
  equipment_name text not null,
  qty numeric not null check (qty >= 0),
  unit text not null,
  unit_rate numeric check (unit_rate is null or unit_rate >= 0),
  mobilization_amount numeric not null default 0 check (mobilization_amount >= 0),
  demobilization_amount numeric not null default 0 check (demobilization_amount >= 0),
  pricing_status text not null default 'unconfirmed' check (pricing_status in ('unconfirmed','market_reference','rfq_confirmed')),
  valid_until date,
  evidence_ref text,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.drying_yard_site_labor_costs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.core_projects(id) on delete cascade,
  site_id uuid not null references public.core_installation_sites(id) on delete cascade,
  boq_item_id uuid references public.drying_yard_boq_items(id) on delete restrict,
  labor_code text,
  labor_name text not null,
  qty numeric not null check (qty >= 0),
  unit text not null,
  unit_rate numeric check (unit_rate is null or unit_rate >= 0),
  pricing_status text not null default 'unconfirmed' check (pricing_status in ('unconfirmed','market_reference','rfq_confirmed')),
  valid_until date,
  evidence_ref text,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint drying_yard_site_labor_costs_unique_boq unique (site_id, boq_item_id)
);

create index if not exists idx_dyssq_project_site on public.drying_yard_site_supplier_quotes(project_id, site_id);
create index if not exists idx_dyssq_site on public.drying_yard_site_supplier_quotes(site_id);
create index if not exists idx_dyssq_supplier on public.drying_yard_site_supplier_quotes(supplier_id);
create index if not exists idx_dyssq_bid on public.drying_yard_site_supplier_quotes(procurement_bid_id);
create index if not exists idx_dysmc_project_site on public.drying_yard_site_material_costs(project_id, site_id);
create index if not exists idx_dysmc_quote on public.drying_yard_site_material_costs(supplier_quote_id);
create index if not exists idx_dysmc_boq on public.drying_yard_site_material_costs(boq_item_id);
create index if not exists idx_dysfc_project_site on public.drying_yard_site_freight_costs(project_id, site_id);
create index if not exists idx_dysfc_site on public.drying_yard_site_freight_costs(site_id);
create index if not exists idx_dysfc_quote on public.drying_yard_site_freight_costs(supplier_quote_id);
create index if not exists idx_dysfc_material on public.drying_yard_site_freight_costs(material_cost_id);
create index if not exists idx_dysec_project_site on public.drying_yard_site_equipment_costs(project_id, site_id);
create index if not exists idx_dysec_site on public.drying_yard_site_equipment_costs(site_id);
create index if not exists idx_dyslc_project_site on public.drying_yard_site_labor_costs(project_id, site_id);
create index if not exists idx_dyslc_boq on public.drying_yard_site_labor_costs(boq_item_id);

alter table public.drying_yard_site_supplier_quotes enable row level security;
alter table public.drying_yard_site_material_costs enable row level security;
alter table public.drying_yard_site_freight_costs enable row level security;
alter table public.drying_yard_site_equipment_costs enable row level security;
alter table public.drying_yard_site_labor_costs enable row level security;

revoke all on table public.drying_yard_site_supplier_quotes from anon, authenticated;
revoke all on table public.drying_yard_site_material_costs from anon, authenticated;
revoke all on table public.drying_yard_site_freight_costs from anon, authenticated;
revoke all on table public.drying_yard_site_equipment_costs from anon, authenticated;
revoke all on table public.drying_yard_site_labor_costs from anon, authenticated;

grant select, insert, update, delete on table public.drying_yard_site_supplier_quotes to service_role;
grant select, insert, update, delete on table public.drying_yard_site_material_costs to service_role;
grant select, insert, update, delete on table public.drying_yard_site_freight_costs to service_role;
grant select, insert, update, delete on table public.drying_yard_site_equipment_costs to service_role;
grant select, insert, update, delete on table public.drying_yard_site_labor_costs to service_role;

create schema if not exists private;

create or replace function private.enforce_drying_yard_site_quote_evidence()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if not exists (select 1 from public.core_installation_sites s where s.id = new.site_id and s.project_id = new.project_id) then
    raise exception using errcode = '23514', message = 'SITECOST_SITE_PROJECT_MISMATCH';
  end if;
  if new.status = 'confirmed' and (
    new.supplier_id is null or new.quotation_ref is null or btrim(new.quotation_ref) = '' or
    new.valid_until is null or new.valid_until < current_date
  ) then
    raise exception using errcode = '23514', message = 'SITECOST_SITE_QUOTE_EVIDENCE_REQUIRED';
  end if;
  return new;
end;
$$;

create or replace function private.enforce_drying_yard_site_material_evidence()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if not exists (select 1 from public.core_installation_sites s where s.id = new.site_id and s.project_id = new.project_id) then
    raise exception using errcode = '23514', message = 'SITECOST_SITE_PROJECT_MISMATCH';
  end if;
  if new.pricing_status = 'rfq_confirmed' then
    if new.unit_price is null or new.unit_price <= 0 or new.valid_until is null or new.valid_until < current_date then
      raise exception using errcode = '23514', message = 'SITECOST_SITE_MATERIAL_RFQ_EVIDENCE_REQUIRED';
    end if;
    if not exists (
      select 1 from public.drying_yard_site_supplier_quotes q
      where q.id = new.supplier_quote_id and q.project_id = new.project_id and q.site_id = new.site_id
        and q.status = 'confirmed' and q.quotation_ref is not null and btrim(q.quotation_ref) <> ''
        and q.valid_until >= current_date
    ) then
      raise exception using errcode = '23514', message = 'SITECOST_SITE_MATERIAL_CONFIRMED_QUOTE_REQUIRED';
    end if;
  end if;
  return new;
end;
$$;

create or replace function private.enforce_drying_yard_site_freight_evidence()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if not exists (select 1 from public.core_installation_sites s where s.id = new.site_id and s.project_id = new.project_id) then
    raise exception using errcode = '23514', message = 'SITECOST_SITE_PROJECT_MISMATCH';
  end if;
  if new.pricing_status = 'rfq_confirmed' then
    if new.amount is null or new.amount < 0 or new.valid_until is null or new.valid_until < current_date then
      raise exception using errcode = '23514', message = 'SITECOST_SITE_FREIGHT_RFQ_EVIDENCE_REQUIRED';
    end if;
    if not exists (
      select 1 from public.drying_yard_site_supplier_quotes q
      where q.id = new.supplier_quote_id and q.project_id = new.project_id and q.site_id = new.site_id
        and q.status = 'confirmed' and q.quotation_ref is not null and btrim(q.quotation_ref) <> ''
        and q.valid_until >= current_date
    ) then
      raise exception using errcode = '23514', message = 'SITECOST_SITE_FREIGHT_CONFIRMED_QUOTE_REQUIRED';
    end if;
  end if;
  return new;
end;
$$;

create or replace function private.enforce_drying_yard_site_rate_evidence()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if not exists (select 1 from public.core_installation_sites s where s.id = new.site_id and s.project_id = new.project_id) then
    raise exception using errcode = '23514', message = 'SITECOST_SITE_PROJECT_MISMATCH';
  end if;
  if new.pricing_status = 'rfq_confirmed' then
    if new.valid_until is null or new.valid_until < current_date or new.evidence_ref is null or btrim(new.evidence_ref) = '' then
      raise exception using errcode = '23514', message = 'SITECOST_SITE_RATE_EVIDENCE_REQUIRED';
    end if;
    if tg_table_name = 'drying_yard_site_equipment_costs' and (new.unit_rate is null or new.unit_rate <= 0) then
      raise exception using errcode = '23514', message = 'SITECOST_SITE_EQUIPMENT_RATE_REQUIRED';
    end if;
    if tg_table_name = 'drying_yard_site_labor_costs' and (new.unit_rate is null or new.unit_rate <= 0) then
      raise exception using errcode = '23514', message = 'SITECOST_SITE_LABOR_RATE_REQUIRED';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_dyssq_evidence on public.drying_yard_site_supplier_quotes;
create trigger trg_dyssq_evidence before insert or update on public.drying_yard_site_supplier_quotes for each row execute function private.enforce_drying_yard_site_quote_evidence();
drop trigger if exists trg_dysmc_evidence on public.drying_yard_site_material_costs;
create trigger trg_dysmc_evidence before insert or update on public.drying_yard_site_material_costs for each row execute function private.enforce_drying_yard_site_material_evidence();
drop trigger if exists trg_dysfc_evidence on public.drying_yard_site_freight_costs;
create trigger trg_dysfc_evidence before insert or update on public.drying_yard_site_freight_costs for each row execute function private.enforce_drying_yard_site_freight_evidence();
drop trigger if exists trg_dysec_evidence on public.drying_yard_site_equipment_costs;
create trigger trg_dysec_evidence before insert or update on public.drying_yard_site_equipment_costs for each row execute function private.enforce_drying_yard_site_rate_evidence();
drop trigger if exists trg_dyslc_evidence on public.drying_yard_site_labor_costs;
create trigger trg_dyslc_evidence before insert or update on public.drying_yard_site_labor_costs for each row execute function private.enforce_drying_yard_site_rate_evidence();

revoke all on function private.enforce_drying_yard_site_quote_evidence() from public, anon, authenticated;
revoke all on function private.enforce_drying_yard_site_material_evidence() from public, anon, authenticated;
revoke all on function private.enforce_drying_yard_site_freight_evidence() from public, anon, authenticated;
revoke all on function private.enforce_drying_yard_site_rate_evidence() from public, anon, authenticated;

create or replace view public.drying_yard_site_material_cost_lines_v
with (security_invoker = true)
as
select m.id, m.project_id, m.site_id, m.boq_item_id, m.supplier_quote_id, m.item_code,
       m.material_group, m.item_name, m.qty, m.unit, m.unit_price,
       case when m.unit_price is null then null else (m.qty * m.unit_price) + m.surcharge_amount - m.discount_amount end as material_line_cost,
       m.pricing_status, m.effective_date, m.valid_until, m.evidence_ref, m.updated_at
from public.drying_yard_site_material_costs m;

revoke all on table public.drying_yard_site_material_cost_lines_v from anon, authenticated;
grant select on table public.drying_yard_site_material_cost_lines_v to service_role;

drop view if exists public.drying_yard_site_cost_summary_v;
create view public.drying_yard_site_cost_summary_v
with (security_invoker = true)
as
with material as (
  select project_id, site_id,
         sum(case when unit_price is null then 0 else (qty * unit_price) + surcharge_amount - discount_amount end) as material_cost,
         count(*) as material_lines,
         count(*) filter (where pricing_status <> 'rfq_confirmed') as material_unconfirmed_lines
  from public.drying_yard_site_material_costs group by project_id, site_id
), freight as (
  select project_id, site_id, sum(coalesce(amount,0)) as freight_cost, count(*) as freight_lines,
         count(*) filter (where pricing_status <> 'rfq_confirmed') as freight_unconfirmed_lines
  from public.drying_yard_site_freight_costs group by project_id, site_id
), equipment as (
  select project_id, site_id,
         sum(case when unit_rate is null then mobilization_amount + demobilization_amount else (qty * unit_rate) + mobilization_amount + demobilization_amount end) as equipment_cost,
         count(*) as equipment_lines,
         count(*) filter (where pricing_status <> 'rfq_confirmed') as equipment_unconfirmed_lines
  from public.drying_yard_site_equipment_costs group by project_id, site_id
), labor as (
  select project_id, site_id, sum(case when unit_rate is null then 0 else qty * unit_rate end) as labor_cost,
         count(*) as labor_lines,
         count(*) filter (where pricing_status <> 'rfq_confirmed') as labor_unconfirmed_lines
  from public.drying_yard_site_labor_costs group by project_id, site_id
), base as (
  select s.project_id, s.id as site_id, s.site_code, s.installation_type,
         l.province, l.district, l.subdistrict, l.latitude, l.longitude,
         coalesce(m.material_cost,0) as material_cost,
         coalesce(f.freight_cost,0) as freight_cost,
         coalesce(e.equipment_cost,0) as equipment_cost,
         coalesce(lb.labor_cost,0) as labor_cost,
         coalesce(m.material_lines,0) as material_lines,
         coalesce(f.freight_lines,0) as freight_lines,
         coalesce(e.equipment_lines,0) as equipment_lines,
         coalesce(lb.labor_lines,0) as labor_lines,
         coalesce(m.material_unconfirmed_lines,0) + coalesce(f.freight_unconfirmed_lines,0) + coalesce(e.equipment_unconfirmed_lines,0) + coalesce(lb.labor_unconfirmed_lines,0) as unconfirmed_cost_lines,
         q.final_price_vat, ps.vat_rate, ps.gross_margin as target_gross_margin
  from public.core_installation_sites s
  join public.core_locations l on l.id = s.location_id
  left join material m on m.project_id = s.project_id and m.site_id = s.id
  left join freight f on f.project_id = s.project_id and f.site_id = s.id
  left join equipment e on e.project_id = s.project_id and e.site_id = s.id
  left join labor lb on lb.project_id = s.project_id and lb.site_id = s.id
  left join public.drying_yard_customer_quotes q on q.project_id = s.project_id and q.site_id = s.id
  left join public.drying_yard_pricing_settings ps on ps.project_id = s.project_id
)
select b.project_id, b.site_id, b.site_code, b.installation_type,
       b.province, b.district, b.subdistrict, b.latitude, b.longitude,
       b.material_cost, b.freight_cost, b.equipment_cost, b.labor_cost,
       b.material_lines, b.freight_lines, b.equipment_lines, b.labor_lines,
       b.material_cost + b.freight_cost + b.equipment_cost + b.labor_cost as total_site_cost,
       b.final_price_vat,
       case when b.vat_rate is null then null else b.final_price_vat / (1 + b.vat_rate) end as selling_price_pre_vat,
       b.target_gross_margin, b.unconfirmed_cost_lines,
       case when b.unconfirmed_cost_lines > 0 or b.material_lines = 0 or b.final_price_vat is null or b.vat_rate is null or b.final_price_vat = 0
            then null
            else ((b.final_price_vat / (1 + b.vat_rate)) - (b.material_cost + b.freight_cost + b.equipment_cost + b.labor_cost)) / (b.final_price_vat / (1 + b.vat_rate)) end as gross_margin,
       case when b.material_lines = 0 then 'missing_cost_sheet'
            when b.unconfirmed_cost_lines > 0 then 'unconfirmed'
            else 'confirmed' end as cost_confirmation_status,
       case when b.material_lines = 0 or b.unconfirmed_cost_lines > 0 then 'HOLD'
            when b.final_price_vat is null or b.vat_rate is null or b.final_price_vat = 0 then 'HOLD'
            when (((b.final_price_vat / (1 + b.vat_rate)) - (b.material_cost + b.freight_cost + b.equipment_cost + b.labor_cost)) / (b.final_price_vat / (1 + b.vat_rate))) < coalesce(b.target_gross_margin,0.32) then 'HOLD'
            else 'GO' end as commercial_gate
from base b;

revoke all on table public.drying_yard_site_cost_summary_v from anon, authenticated;
grant select on table public.drying_yard_site_cost_summary_v to service_role;
