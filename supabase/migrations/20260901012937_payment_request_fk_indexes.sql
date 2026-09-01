create index if not exists drying_yard_payment_requests_supplier_bid_idx
  on public.drying_yard_supplier_payment_requests(supplier_bid_id);

create index if not exists drying_yard_payment_request_reviews_invoice_idx
  on public.drying_yard_supplier_payment_request_reviews(invoice_id);
