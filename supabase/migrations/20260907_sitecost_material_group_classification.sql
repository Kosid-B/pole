update public.drying_yard_site_material_costs
set material_group = case item_code
  when 'concrete' then 'CONCRETE_240KSC'
  when 'base_rock' then 'AGGREGATE'
  when 'sand' then 'AGGREGATE'
  when 'shoulder_rock' then 'AGGREGATE'
  when 'rb19' then 'STEEL_REINFORCEMENT'
  when 'wiremesh' then 'STEEL_REINFORCEMENT'
  when 'asphalt' then 'ASPHALT'
  when 'form' then 'FORMWORK'
  when 'geotextile' then 'GEOTEXTILE'
  else material_group
end,
updated_at = now()
where item_code in ('concrete','base_rock','sand','shoulder_rock','rb19','wiremesh','asphalt','form','geotextile')
  and pricing_status = 'unconfirmed';

create or replace view public.drying_yard_site_material_group_readiness_v
with (security_invoker=true) as
select
  m.project_id,
  m.material_group,
  count(distinct m.id)::bigint as material_lines,
  count(distinct m.site_id)::bigint as site_count,
  count(distinct m.id) filter (where m.pricing_status='rfq_confirmed')::bigint as confirmed_lines,
  count(distinct m.id) filter (where m.pricing_status<>'rfq_confirmed')::bigint as unconfirmed_lines,
  count(distinct d.id)::bigint as supplier_candidates
from public.drying_yard_site_material_costs m
left join public.drying_yard_supplier_directory d
  on d.project_id=m.project_id and d.material_group=m.material_group
group by m.project_id,m.material_group;

revoke all on public.drying_yard_site_material_group_readiness_v from public, anon, authenticated;
grant select on public.drying_yard_site_material_group_readiness_v to service_role;