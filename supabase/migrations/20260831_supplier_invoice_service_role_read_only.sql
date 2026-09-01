revoke insert, update, delete, truncate, references, trigger on public.drying_yard_supplier_invoices from service_role;
revoke insert, update, delete, truncate, references, trigger on public.drying_yard_supplier_invoice_lines from service_role;
revoke insert, update, delete, truncate, references, trigger on public.drying_yard_supplier_invoice_reviews from service_role;

grant select on public.drying_yard_supplier_invoices to service_role;
grant select on public.drying_yard_supplier_invoice_lines to service_role;
grant select on public.drying_yard_supplier_invoice_reviews to service_role;
