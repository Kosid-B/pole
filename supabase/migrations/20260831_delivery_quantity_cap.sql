create or replace function public.drying_yard_submit_delivery_receipt(
  p_request_id text,
  p_project_id uuid,
  p_calloff_id uuid,
  p_do_ref text,
  p_truck_no text,
  p_delivered_m3 numeric,
  p_accepted_m3 numeric,
  p_rejected_m3 numeric,
  p_slump_mm numeric,
  p_concrete_temp_c numeric,
  p_cube_sample_ref text,
  p_evidence_ref text,
  p_note text,
  p_submitted_by_user_id text,
  p_submitted_by_email text,
  p_submitted_by_name text,
  p_submitted_by_role text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_calloff public.drying_yard_supplier_calloffs%rowtype;
  v_batch public.drying_yard_batch_releases%rowtype;
  v_qa text;
  v_id uuid;
  v_reserved_delivery numeric := 0;
begin
  if p_submitted_by_role not in ('EXECUTIVE','ADMIN','FIELD_LEADER') then raise exception 'SUBMITTER_ROLE_BLOCK'; end if;
  if coalesce(trim(p_request_id),'') = '' or coalesce(trim(p_do_ref),'') = '' or coalesce(trim(p_evidence_ref),'') = '' then raise exception 'DELIVERY_EVIDENCE_REQUIRED'; end if;
  if coalesce(trim(p_submitted_by_user_id),'') = '' or coalesce(trim(p_submitted_by_email),'') = '' or coalesce(trim(p_submitted_by_name),'') = '' then raise exception 'ACTOR_IDENTITY_REQUIRED'; end if;
  if p_delivered_m3 is null or p_delivered_m3 <= 0 or p_accepted_m3 is null or p_accepted_m3 < 0 or p_rejected_m3 is null or p_rejected_m3 < 0 then raise exception 'DELIVERY_QUANTITY_INVALID'; end if;
  if abs(p_delivered_m3 - (p_accepted_m3 + p_rejected_m3)) > 0.01 then raise exception 'DELIVERY_RECONCILIATION_MISMATCH'; end if;

  select * into v_calloff
  from public.drying_yard_supplier_calloffs
  where id = p_calloff_id and project_id = p_project_id
  for update;
  if not found then raise exception 'CALLOFF_NOT_FOUND'; end if;
  if v_calloff.status <> 'confirmed' then raise exception 'CALLOFF_NOT_OPEN'; end if;

  select * into v_batch from public.drying_yard_batch_releases where id = v_calloff.batch_id and project_id = p_project_id;
  if not found or v_batch.status not in ('released','in_progress') then raise exception 'BATCH_NOT_ACTIVE_FOR_DELIVERY'; end if;

  select coalesce(sum(s.delivered_m3),0)
  into v_reserved_delivery
  from public.drying_yard_delivery_receipt_submissions s
  left join public.drying_yard_delivery_receipt_reviews r on r.submission_id = s.id
  where s.calloff_id = v_calloff.id
    and (r.id is null or r.decision = 'accepted');

  if v_reserved_delivery + p_delivered_m3 > v_calloff.requested_m3 + 0.01 then
    raise exception 'DELIVERY_EXCEEDS_CALLOFF_QUANTITY';
  end if;

  if p_accepted_m3 = 0 then v_qa := 'rejected';
  elsif p_rejected_m3 > 0 then v_qa := 'partial';
  else v_qa := 'accepted';
  end if;

  insert into public.drying_yard_delivery_receipt_submissions(
    request_id, project_id, calloff_id, batch_id, site_id, do_ref, truck_no, delivered_m3, accepted_m3, rejected_m3,
    qa_status, slump_mm, concrete_temp_c, cube_sample_ref, evidence_ref, note,
    submitted_by_user_id, submitted_by_email, submitted_by_name, submitted_by_role
  ) values (
    trim(p_request_id), p_project_id, v_calloff.id, v_calloff.batch_id, v_calloff.site_id, trim(p_do_ref), nullif(trim(coalesce(p_truck_no,'')),''),
    p_delivered_m3, p_accepted_m3, p_rejected_m3, v_qa, p_slump_mm, p_concrete_temp_c,
    nullif(trim(coalesce(p_cube_sample_ref,'')),''), trim(p_evidence_ref), nullif(trim(coalesce(p_note,'')),''),
    trim(p_submitted_by_user_id), lower(trim(p_submitted_by_email)), trim(p_submitted_by_name), p_submitted_by_role
  ) returning id into v_id;

  return jsonb_build_object(
    'ok', true,
    'submission_id', v_id,
    'qa_status', v_qa,
    'review_status', 'pending',
    'reserved_delivery_before_m3', v_reserved_delivery,
    'remaining_calloff_after_submission_m3', greatest(0, v_calloff.requested_m3 - v_reserved_delivery - p_delivered_m3)
  );
end;
$$;

revoke execute on function public.drying_yard_submit_delivery_receipt(text,uuid,uuid,text,text,numeric,numeric,numeric,numeric,numeric,text,text,text,text,text,text,text) from public, anon, authenticated;
grant execute on function public.drying_yard_submit_delivery_receipt(text,uuid,uuid,text,text,numeric,numeric,numeric,numeric,numeric,text,text,text,text,text,text,text) to service_role;
