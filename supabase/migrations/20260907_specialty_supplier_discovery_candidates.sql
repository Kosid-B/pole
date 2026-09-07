-- SiteCost 446: specialty-material public discovery candidates.
-- IMPORTANT: these rows are candidate-only. No service coverage, price, credit,
-- freight, capacity, lead time or TDC is asserted by this seed.
-- Commercial status remains UNCONFIRMED until RFQ evidence passes DB gates.

with project_scope as (
  select distinct project_id
  from public.drying_yard_supplier_directory
  limit 1
), candidates(material_group, supplier_name, plant_location, phone, email, website, source_url, priority_rank, note) as (
  values
    ('ASPHALT', 'Asian Asphalt Co., Ltd.', 'Thailand', '053-111667', null, 'https://www.asianasphalt.co.th/', 'https://www.asianasphalt.co.th/', 10,
      'GLOBAL DISCOVERY CANDIDATE ONLY. Service coverage, commercial terms, quotation, freight, capacity and lead time are UNVERIFIED and require RFQ.'),
    ('ASPHALT', 'Pro One Petroleum & Asphalt Co., Ltd.', 'Bangkok', '086-321-1416', 'Marketing@pro-1.co.th', 'https://pro-1.co.th/', 'https://pro-1.co.th/en/contact-us/', 20,
      'GLOBAL DISCOVERY CANDIDATE ONLY. Service coverage, commercial terms, quotation, freight, capacity and lead time are UNVERIFIED and require RFQ.'),
    ('GEOTEXTILE', 'THAI KN Corporation Co., Ltd.', 'Bangkok', '02-096-3998', 'sale@thaikn.com', 'https://www.thaikn.com/', 'https://www.thaikn.com/', 10,
      'GLOBAL DISCOVERY CANDIDATE ONLY. Service coverage, commercial terms, quotation, freight, capacity and lead time are UNVERIFIED and require RFQ.'),
    ('GEOTEXTILE', 'Narula Nonwoven', 'Samut Sakhon', '034-871-555', null, 'https://www.narula.co.th/', 'https://www.narula.co.th/geotextiles/', 20,
      'GLOBAL DISCOVERY CANDIDATE ONLY. Service coverage, commercial terms, quotation, freight, capacity and lead time are UNVERIFIED and require RFQ.'),
    ('GEOTEXTILE', 'Bangkok Gabion', 'Thailand', '061-456-1644', null, 'https://bangkokgabions.com/', 'https://bangkokgabions.com/services/', 30,
      'GLOBAL DISCOVERY CANDIDATE ONLY. Service coverage, commercial terms, quotation, freight, capacity and lead time are UNVERIFIED and require RFQ.'),
    ('FORMWORK', 'Alpi South East Asia Co., Ltd.', 'Bangkok / Thailand', null, null, 'https://www.alpisea.com/', 'https://www.alpisea.com/', 10,
      'GLOBAL DISCOVERY CANDIDATE ONLY. Service coverage, commercial terms, quotation, freight, capacity and lead time are UNVERIFIED and require RFQ.'),
    ('FORMWORK', 'PERI Formwork & Scaffolding (Thailand) Ltd.', 'Bangkok', null, null, null, 'https://www.trademo.com/thailand/manufacturers/formwork', 20,
      'GLOBAL DISCOVERY CANDIDATE ONLY. Public listing discovered; direct contact/service coverage/commercial terms require verification and RFQ.')
)
insert into public.drying_yard_supplier_directory (
  project_id,
  procurement_zone_code,
  material_group,
  supplier_name,
  plant_location,
  service_provinces,
  phone,
  email,
  website,
  source_url,
  source_kind,
  contact_verified_at,
  contact_status,
  commercial_status,
  recommendation_status,
  priority_rank,
  note
)
select
  p.project_id,
  'GLOBAL',
  c.material_group,
  c.supplier_name,
  c.plant_location,
  '{}'::text[],
  c.phone,
  c.email,
  c.website,
  c.source_url,
  'public_web',
  now(),
  'public_contact_found',
  'unconfirmed',
  'candidate',
  c.priority_rank,
  c.note
from project_scope p
cross join candidates c
on conflict (project_id, procurement_zone_code, material_group, supplier_name)
do update set
  plant_location = excluded.plant_location,
  phone = coalesce(excluded.phone, public.drying_yard_supplier_directory.phone),
  email = coalesce(excluded.email, public.drying_yard_supplier_directory.email),
  website = coalesce(excluded.website, public.drying_yard_supplier_directory.website),
  source_url = excluded.source_url,
  source_kind = excluded.source_kind,
  contact_verified_at = excluded.contact_verified_at,
  contact_status = excluded.contact_status,
  commercial_status = 'unconfirmed',
  recommendation_status = 'candidate',
  priority_rank = excluded.priority_rank,
  service_provinces = '{}'::text[],
  credit_days = null,
  deposit_pct = null,
  capacity_per_day = null,
  lead_time_days = null,
  distance_km = null,
  quoted_base_rate = null,
  estimated_freight = null,
  total_delivered_cost = null,
  note = excluded.note,
  updated_at = now();
