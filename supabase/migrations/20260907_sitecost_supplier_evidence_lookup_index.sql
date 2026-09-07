-- SiteCost Drying Yard 446
-- Supports the supplier commercial evidence trigger and RFQ readiness checks.

create index if not exists idx_dypb_project_supplier_status_validity
on public.drying_yard_procurement_bids (
  project_id,
  lower(btrim(supplier_name)),
  bid_status,
  valid_until
)
where supplier_name is not null;
