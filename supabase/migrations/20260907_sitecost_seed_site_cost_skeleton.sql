-- Seed SiteCost 446 cost-sheet skeletons from exact site size mapping and canonical BOQ.
-- Intentionally does NOT populate prices or rates. All seeded lines remain UNCONFIRMED.

with target_project as (
  select id from public.core_projects where project_code = 'DRYING-YARD-446' limit 1
), site_map as (
  select s.project_id, s.id as site_id,
         (sp.width_m * sp.length_m)::integer as area_m2
  from public.core_installation_sites s
  join target_project p on p.id = s.project_id
  join public.core_locations l on l.id = s.location_id
  join public.drying_yard_size_assignments_by_g a
    on a.project_id = s.project_id
   and a.province = l.province
   and a.installation_type = s.installation_type
  join public.drying_yard_size_profiles sp on sp.id = a.size_profile_id
)
insert into public.drying_yard_site_material_costs (
  project_id, site_id, boq_item_id, item_code, material_group, item_name,
  qty, unit, unit_price, pricing_status, evidence_ref, note
)
select
  sm.project_id, sm.site_id, b.id, b.item_code, 'material', b.item_name,
  b.qty, b.unit, null, 'unconfirmed', null,
  'Site-specific BOQ skeleton; unit price requires RFQ/quotation evidence.'
from site_map sm
join public.drying_yard_boq_items b
  on b.project_id = sm.project_id
 and b.area_m2 = sm.area_m2
 and b.category = 'material'
 and b.active is true
on conflict (site_id, boq_item_id) do nothing;

with target_project as (
  select id from public.core_projects where project_code = 'DRYING-YARD-446' limit 1
), site_map as (
  select s.project_id, s.id as site_id,
         (sp.width_m * sp.length_m)::integer as area_m2
  from public.core_installation_sites s
  join target_project p on p.id = s.project_id
  join public.core_locations l on l.id = s.location_id
  join public.drying_yard_size_assignments_by_g a
    on a.project_id = s.project_id
   and a.province = l.province
   and a.installation_type = s.installation_type
  join public.drying_yard_size_profiles sp on sp.id = a.size_profile_id
)
insert into public.drying_yard_site_labor_costs (
  project_id, site_id, boq_item_id, labor_code, labor_name,
  qty, unit, unit_rate, pricing_status, evidence_ref, note
)
select
  sm.project_id, sm.site_id, b.id, b.item_code, b.item_name,
  b.qty, b.unit, null, 'unconfirmed', null,
  'Site-specific BOQ skeleton; unit rate requires site-specific evidence.'
from site_map sm
join public.drying_yard_boq_items b
  on b.project_id = sm.project_id
 and b.area_m2 = sm.area_m2
 and b.category = 'labor'
 and b.active is true
on conflict (site_id, boq_item_id) do nothing;
