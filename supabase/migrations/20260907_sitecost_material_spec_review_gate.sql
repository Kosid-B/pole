create table if not exists public.drying_yard_material_spec_reviews (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null,
  province text,
  material_group text not null,
  quotation_ref text not null,
  supplier_name text not null,
  required_spec text not null,
  offered_spec text not null,
  comparison_basis text,
  review_status text not null default 'pending' check (review_status in ('pending','approved','rejected')),
  evidence_ref text,
  reviewed_by text,
  reviewed_at timestamptz,
  review_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists uq_dymsr_scope_quote_material
on public.drying_yard_material_spec_reviews(project_id,coalesce(province,''),quotation_ref,material_group,supplier_name);

create index if not exists idx_dymsr_project_status
on public.drying_yard_material_spec_reviews(project_id,review_status,material_group);

alter table public.drying_yard_material_spec_reviews enable row level security;
revoke all on public.drying_yard_material_spec_reviews from anon, authenticated;
grant select,insert,update on public.drying_yard_material_spec_reviews to service_role;

insert into public.drying_yard_material_spec_reviews (
  project_id,province,material_group,quotation_ref,supplier_name,
  required_spec,offered_spec,comparison_basis,review_status,evidence_ref,review_note
)
select distinct
  s.project_id,
  'กาฬสินธุ์',
  'CONCRETE_240KSC',
  'ND690907/001',
  'หจก.นพดลวัสดุหนองแปน (สำนักงานใหญ่)',
  'ST240 = 240 kgf/cm2 per project BOQ; 29.36 m3 for 192 m2 drying yard',
  'C21/24 per supplier quotation ND690907/001; 2,180 THB/m3 VAT-inclusive',
  'Technical candidate only: 240 kgf/cm2 = 23.536 MPa; C21/24 nomenclature commonly denotes 21 MPa cylinder / 24 MPa cube. Confirm supplier test basis, standard, mix certificate, and acceptance criteria before approval.',
  'pending',
  'Project BOQ: งานลานตาก จ.กำแพงเพชร 4 แห่ง.pdf; Supplier quote ND690907/001',
  'Fail-closed. Do not apply concrete quote as rfq_confirmed until Engineer/QA approves equivalence and site freight/TDC evidence exists.'
from public.drying_yard_site_cost_summary_v s
where s.province='กาฬสินธุ์'
limit 1
on conflict do nothing;
