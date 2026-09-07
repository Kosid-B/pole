alter table public.drying_yard_procurement_bids
  add column if not exists supplier_directory_id uuid references public.drying_yard_supplier_directory(id);

create index if not exists idx_dypb_supplier_directory
  on public.drying_yard_procurement_bids(supplier_directory_id);

create unique index if not exists uq_dypc_project_province_material_group
  on public.drying_yard_procurement_clusters(project_id,province,material_group);

update public.drying_yard_procurement_clusters
set target_gm=0.32,
    note=concat_ws(' | ',nullif(note,''),'Competitive floor 25% is advisory only; working/approved GM remains 32% until cost/RFQ/cash gates pass.'),
    updated_at=now()
where province='กาฬสินธุ์';

with p as (
  select project_id
  from public.drying_yard_procurement_clusters
  where province='กาฬสินธุ์' and material_group='CONCRETE_240KSC'
  limit 1
), new_clusters(material_group,cluster_name,forecast_sites,forecast_volume_m3,target_saving_per_m3,note) as (
  values
    ('AGGREGATE','กาฬสินธุ์ Aggregate Cluster',120,5280::numeric,0::numeric,'BOQ: base rock 3,456 m3 + sand 1,152 m3 + shoulder rock 672 m3. RFQ required; no averaged price.'),
    ('STEEL_REINFORCEMENT','กาฬสินธุ์ Steel Cluster',120,0::numeric,0::numeric,'BOQ: RB19 15,696 kg + Wiremesh 23,040 m2. forecast_volume_m3 intentionally 0 because units are not m3.'),
    ('ASPHALT','กาฬสินธุ์ Asphalt Cluster',120,0::numeric,0::numeric,'BOQ: asphalt 2,400 liters. Global discovery candidates only; Kalasin delivery coverage unconfirmed.'),
    ('FORMWORK','กาฬสินธุ์ Formwork Cluster',120,0::numeric,0::numeric,'BOQ: formwork 1,008 m2. Global discovery candidates only; Kalasin delivery coverage unconfirmed.'),
    ('GEOTEXTILE','กาฬสินธุ์ Geotextile Cluster',120,0::numeric,0::numeric,'BOQ: geotextile 23,040 m2. Global discovery candidates only; Kalasin delivery coverage unconfirmed.')
)
insert into public.drying_yard_procurement_clusters(
  project_id,material_group,cluster_name,province,forecast_sites,forecast_volume_m3,
  benchmark_delivered_rate,target_saving_per_m3,customer_payment_mode,customer_funded_pct,
  rfq_status,note,target_gm
)
select p.project_id,n.material_group,n.cluster_name,'กาฬสินธุ์',n.forecast_sites,n.forecast_volume_m3,
       0,n.target_saving_per_m3,'customer_direct_pay',100,'rfq_ready',n.note,0.32
from p cross join new_clusters n
on conflict (project_id,province,material_group) do update set
  forecast_sites=excluded.forecast_sites,
  forecast_volume_m3=excluded.forecast_volume_m3,
  target_saving_per_m3=excluded.target_saving_per_m3,
  rfq_status='rfq_ready',
  target_gm=0.32,
  note=excluded.note,
  updated_at=now();

update public.drying_yard_procurement_bids b
set supplier_directory_id=(
      select sd.id from public.drying_yard_supplier_directory sd
      where sd.project_id=b.project_id
        and sd.material_group='CONCRETE_240KSC'
        and sd.supplier_name='หจก.นพดลวัสดุหนองแปน (สำนักงานใหญ่)'
      limit 1
    ),
    updated_at=now()
from public.drying_yard_procurement_clusters c
where c.id=b.cluster_id and c.province='กาฬสินธุ์' and c.material_group='CONCRETE_240KSC'
  and b.supplier_slot='A';

update public.drying_yard_procurement_bids b
set supplier_directory_id=(
      select sd.id from public.drying_yard_supplier_directory sd
      where sd.project_id=b.project_id
        and sd.material_group='CONCRETE_240KSC'
        and sd.supplier_name=b.supplier_name
      limit 1
    ),
    updated_at=now()
from public.drying_yard_procurement_clusters c
where c.id=b.cluster_id and c.province='กาฬสินธุ์' and c.material_group='CONCRETE_240KSC'
  and b.supplier_slot='C';

with target_clusters as (
  select c.id as cluster_id,c.project_id,c.material_group
  from public.drying_yard_procurement_clusters c
  where c.province='กาฬสินธุ์'
    and c.material_group in ('AGGREGATE','STEEL_REINFORCEMENT','ASPHALT','FORMWORK','GEOTEXTILE')
), candidate_pool as (
  select tc.cluster_id,tc.project_id,tc.material_group,sd.id as supplier_directory_id,
         sd.supplier_name,sd.plant_location,sd.priority_rank,
         case when sd.service_provinces @> array['กาฬสินธุ์']::text[] then 0 else 1 end as scope_rank,
         case when sd.service_provinces @> array['กาฬสินธุ์']::text[] then 'KALASIN_SCOPED' else 'GLOBAL_DISCOVERY' end as scope_status,
         row_number() over (
           partition by tc.cluster_id
           order by case when sd.service_provinces @> array['กาฬสินธุ์']::text[] then 0 else 1 end,
                    sd.priority_rank nulls last,sd.supplier_name
         ) as rn
  from target_clusters tc
  join public.drying_yard_supplier_directory sd
    on sd.project_id=tc.project_id and sd.material_group=tc.material_group
  where sd.service_provinces @> array['กาฬสินธุ์']::text[]
     or coalesce(array_length(sd.service_provinces,1),0)=0
), slots as (
  select tc.cluster_id,tc.project_id,tc.material_group,v.slot,v.slot_no
  from target_clusters tc
  cross join (values ('A',1),('B',2),('C',3)) v(slot,slot_no)
), seeded as (
  select s.cluster_id,s.project_id,s.material_group,s.slot,
         cp.supplier_directory_id,cp.supplier_name,cp.plant_location,cp.scope_status
  from slots s
  left join candidate_pool cp on cp.cluster_id=s.cluster_id and cp.rn=s.slot_no
)
insert into public.drying_yard_procurement_bids(
  project_id,cluster_id,supplier_slot,supplier_directory_id,supplier_name,plant_location,
  base_rate,freight_per_m3,pump_per_m3,waiting_per_m3,short_load_per_m3,
  cash_discount_per_m3,volume_rebate_per_m3,schedule_discount_per_m3,other_adjustment_per_m3,
  capacity_m3_day,lead_time_days,payment_terms,quotation_ref,valid_until,bid_status,note
)
select s.project_id,s.cluster_id,s.slot,s.supplier_directory_id,s.supplier_name,s.plant_location,
       0,0,0,0,0,0,0,0,0,null,null,null,null,null,'sourcing',
       case
         when s.supplier_directory_id is null then 'Independent backup supplier required. No candidate assigned; sourcing required.'
         when s.scope_status='KALASIN_SCOPED' then 'Prefilled from Supplier Directory with Kalasin service scope. All commercial terms, price, freight/TDC, capacity and lead time remain unconfirmed; RFQ required.'
         else 'GLOBAL DISCOVERY candidate only. Kalasin service/delivery coverage and all commercial terms remain unconfirmed; verify coverage before RFQ confirmation.'
       end
from seeded s
where not exists (
  select 1 from public.drying_yard_procurement_bids b
  where b.cluster_id=s.cluster_id and b.supplier_slot=s.slot
);
