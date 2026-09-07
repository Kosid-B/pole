-- SiteCost Drying Yard 446
-- Hard guardrail: supplier-directory commercial status cannot be promoted to
-- quoted/confirmed without matching RFQ/quotation evidence in procurement bids.
-- This is a database-level backstop for all API/code paths.

create or replace function private.enforce_drying_yard_supplier_commercial_evidence()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_has_evidence boolean := false;
begin
  if new.commercial_status not in ('quoted', 'confirmed') then
    return new;
  end if;

  select exists (
    select 1
    from public.drying_yard_procurement_bids b
    join public.drying_yard_procurement_clusters c
      on c.id = b.cluster_id
     and c.project_id = b.project_id
    where b.project_id = new.project_id
      and lower(btrim(coalesce(b.supplier_name, ''))) = lower(btrim(coalesce(new.supplier_name, '')))
      and c.material_group = new.material_group
      and b.base_rate > 0
      and btrim(coalesce(b.quotation_ref, '')) <> ''
      and b.valid_until is not null
      and b.valid_until >= current_date
      and (
        (new.commercial_status = 'quoted' and b.bid_status in ('quoted', 'confirmed'))
        or
        (new.commercial_status = 'confirmed'
          and b.bid_status = 'confirmed'
          and b.capacity_m3_day is not null and b.capacity_m3_day > 0
          and b.lead_time_days is not null
          and btrim(coalesce(b.payment_terms, '')) <> ''
          and (
            coalesce(b.base_rate, 0)
            + coalesce(b.freight_per_m3, 0)
            + coalesce(b.pump_per_m3, 0)
            + coalesce(b.waiting_per_m3, 0)
            + coalesce(b.short_load_per_m3, 0)
            - coalesce(b.cash_discount_per_m3, 0)
            - coalesce(b.volume_rebate_per_m3, 0)
            - coalesce(b.schedule_discount_per_m3, 0)
            + coalesce(b.other_adjustment_per_m3, 0)
          ) > 0
        )
      )
  ) into v_has_evidence;

  if not v_has_evidence then
    raise exception using
      errcode = '23514',
      message = 'SITECOST_SUPPLIER_COMMERCIAL_EVIDENCE_REQUIRED',
      detail = format(
        'Cannot set supplier commercial_status to %s without matching RFQ/quotation evidence and readiness in procurement bids.',
        new.commercial_status
      ),
      hint = 'Update the cluster RFQ bid first. Keep supplier commercial terms unconfirmed until evidence is complete.';
  end if;

  return new;
end;
$$;

revoke execute on function private.enforce_drying_yard_supplier_commercial_evidence() from public;
revoke execute on function private.enforce_drying_yard_supplier_commercial_evidence() from anon;
revoke execute on function private.enforce_drying_yard_supplier_commercial_evidence() from authenticated;

drop trigger if exists trg_drying_yard_supplier_commercial_evidence
  on public.drying_yard_supplier_directory;

create trigger trg_drying_yard_supplier_commercial_evidence
before insert or update of commercial_status, supplier_name, material_group, project_id
on public.drying_yard_supplier_directory
for each row
execute function private.enforce_drying_yard_supplier_commercial_evidence();
