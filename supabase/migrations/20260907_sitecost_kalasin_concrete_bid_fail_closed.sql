with kalasin_concrete_cluster as (
  select id
  from public.drying_yard_procurement_clusters
  where province='กาฬสินธุ์' and material_group='CONCRETE_240KSC'
  limit 1
)
update public.drying_yard_procurement_bids b
set bid_status='quoted',
    capacity_m3_day=null,
    lead_time_days=null,
    note='Supplier quote ND690907/001 is valid commercial evidence for base rate/payment terms only. C21/24 vs required ST240 is pending Material Spec Review; freight/TDC, capacity and lead time are unconfirmed. Not award-ready.',
    updated_at=now()
where b.cluster_id=(select id from kalasin_concrete_cluster)
  and b.supplier_slot='A'
  and b.quotation_ref='ND690907/001';

with kalasin_concrete_cluster as (
  select id
  from public.drying_yard_procurement_clusters
  where province='กาฬสินธุ์' and material_group='CONCRETE_240KSC'
  limit 1
)
update public.drying_yard_procurement_bids b
set supplier_name=null,
    plant_location=null,
    base_rate=0,
    freight_per_m3=0,
    pump_per_m3=0,
    waiting_per_m3=0,
    short_load_per_m3=0,
    cash_discount_per_m3=0,
    volume_rebate_per_m3=0,
    schedule_discount_per_m3=0,
    other_adjustment_per_m3=0,
    capacity_m3_day=null,
    lead_time_days=null,
    payment_terms=null,
    quotation_ref=null,
    valid_until=null,
    bid_status='sourcing',
    note='Independent backup supplier required. Previous Slot B duplicated Slot A supplier/quotation and must not be counted as competitive backup evidence.',
    updated_at=now()
where b.cluster_id=(select id from kalasin_concrete_cluster)
  and b.supplier_slot='B';
