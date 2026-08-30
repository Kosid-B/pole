create table if not exists public.drying_yard_site_readiness_submissions (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null unique,
  project_id uuid not null references public.core_projects(id) on delete cascade,
  batch_id uuid not null references public.drying_yard_batch_releases(id) on delete cascade,
  site_id uuid not null references public.core_installation_sites(id) on delete cascade,
  submitted_by_user_id text not null,
  submitted_by_email text not null,
  submitted_by_name text not null,
  submitted_by_role text not null check (submitted_by_role in ('EXECUTIVE','ADMIN','FIELD_LEADER')),
  quantity_confirmed boolean not null default false,
  drawing_confirmed boolean not null default false,
  site_condition_confirmed boolean not null default false,
  access_ready boolean not null default false,
  confirmed_area_m2 numeric check (confirmed_area_m2 is null or confirmed_area_m2 >= 0),
  confirmed_concrete_m3 numeric check (confirmed_concrete_m3 is null or confirmed_concrete_m3 >= 0),
  evidence_ref text,
  note text,
  candidate_ready boolean not null default false,
  submitted_at timestamptz not null default now()
);

create table if not exists public.drying_yard_site_readiness_reviews (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null unique,
  submission_id uuid not null unique references public.drying_yard_site_readiness_submissions(id) on delete restrict,
  project_id uuid not null references public.core_projects(id) on delete cascade,
  batch_id uuid not null references public.drying_yard_batch_releases(id) on delete cascade,
  site_id uuid not null references public.core_installation_sites(id) on delete cascade,
  decision text not null check (decision in ('accepted','rejected')),
  reviewed_by_user_id text not null,
  reviewed_by_email text not null,
  reviewed_by_name text not null,
  reviewed_by_role text not null check (reviewed_by_role in ('EXECUTIVE','ADMIN')),
  review_reason text not null check (char_length(trim(review_reason)) between 8 and 2000),
  snapshot jsonb not null default '{}'::jsonb,
  reviewed_at timestamptz not null default now()
);

create index if not exists drying_yard_readiness_submission_site_idx
  on public.drying_yard_site_readiness_submissions(project_id,site_id,submitted_at desc);
create index if not exists drying_yard_readiness_submission_batch_idx
  on public.drying_yard_site_readiness_submissions(batch_id,submitted_at desc);
create index if not exists drying_yard_readiness_review_batch_idx
  on public.drying_yard_site_readiness_reviews(batch_id,reviewed_at desc);

alter table public.drying_yard_site_readiness_submissions enable row level security;
alter table public.drying_yard_site_readiness_reviews enable row level security;

create or replace function public.drying_yard_field_readiness_immutable()
returns trigger language plpgsql as $$
begin
  raise exception 'FIELD_READINESS_AUDIT_IMMUTABLE';
end;
$$;

drop trigger if exists trg_drying_yard_readiness_submission_immutable on public.drying_yard_site_readiness_submissions;
create trigger trg_drying_yard_readiness_submission_immutable
before update or delete on public.drying_yard_site_readiness_submissions
for each row execute function public.drying_yard_field_readiness_immutable();

drop trigger if exists trg_drying_yard_readiness_review_immutable on public.drying_yard_site_readiness_reviews;
create trigger trg_drying_yard_readiness_review_immutable
before update or delete on public.drying_yard_site_readiness_reviews
for each row execute function public.drying_yard_field_readiness_immutable();

create or replace function public.drying_yard_submit_site_readiness(
  p_request_id uuid,p_project_id uuid,p_batch_id uuid,p_site_id uuid,
  p_submitted_by_user_id text,p_submitted_by_email text,p_submitted_by_name text,p_submitted_by_role text,
  p_quantity_confirmed boolean,p_drawing_confirmed boolean,p_site_condition_confirmed boolean,p_access_ready boolean,
  p_confirmed_area_m2 numeric,p_confirmed_concrete_m3 numeric,p_evidence_ref text,p_note text
) returns jsonb language plpgsql security definer set search_path=public as $$
declare
  v_existing public.drying_yard_site_readiness_submissions%rowtype;
  v_batch public.drying_yard_batch_releases%rowtype;
  v_batch_site public.drying_yard_batch_release_sites%rowtype;
  v_candidate_ready boolean;
begin
  select * into v_existing from public.drying_yard_site_readiness_submissions where request_id=p_request_id;
  if found then return jsonb_build_object('ok',true,'idempotent',true,'submission_id',v_existing.id,'candidate_ready',v_existing.candidate_ready); end if;
  if p_submitted_by_role not in ('EXECUTIVE','ADMIN','FIELD_LEADER') then raise exception 'SUBMITTER_ROLE_BLOCK'; end if;
  if nullif(trim(coalesce(p_submitted_by_user_id,'')),'') is null or nullif(trim(coalesce(p_submitted_by_email,'')),'') is null or nullif(trim(coalesce(p_submitted_by_name,'')),'') is null then raise exception 'SUBMITTER_IDENTITY_REQUIRED'; end if;
  if coalesce(p_confirmed_area_m2,0)<0 or coalesce(p_confirmed_concrete_m3,0)<0 then raise exception 'INVALID_CONFIRMED_QUANTITY'; end if;
  select * into v_batch from public.drying_yard_batch_releases where id=p_batch_id and project_id=p_project_id for share;
  if not found then raise exception 'BATCH_NOT_FOUND'; end if;
  if v_batch.status in ('released','in_progress','completed','cancelled') then raise exception 'BATCH_READINESS_LOCKED'; end if;
  select * into v_batch_site from public.drying_yard_batch_release_sites where batch_id=p_batch_id and site_id=p_site_id for share;
  if not found then raise exception 'BATCH_SITE_NOT_FOUND'; end if;
  v_candidate_ready := coalesce(p_quantity_confirmed,false) and coalesce(p_drawing_confirmed,false) and coalesce(p_site_condition_confirmed,false) and coalesce(p_access_ready,false) and coalesce(p_confirmed_concrete_m3,0)>0;
  if v_candidate_ready and nullif(trim(coalesce(p_evidence_ref,'')),'') is null then raise exception 'EVIDENCE_REQUIRED_FOR_READY_CANDIDATE'; end if;
  insert into public.drying_yard_site_readiness_submissions(
    request_id,project_id,batch_id,site_id,submitted_by_user_id,submitted_by_email,submitted_by_name,submitted_by_role,
    quantity_confirmed,drawing_confirmed,site_condition_confirmed,access_ready,confirmed_area_m2,confirmed_concrete_m3,evidence_ref,note,candidate_ready
  ) values (
    p_request_id,p_project_id,p_batch_id,p_site_id,trim(p_submitted_by_user_id),lower(trim(p_submitted_by_email)),trim(p_submitted_by_name),p_submitted_by_role,
    coalesce(p_quantity_confirmed,false),coalesce(p_drawing_confirmed,false),coalesce(p_site_condition_confirmed,false),coalesce(p_access_ready,false),
    p_confirmed_area_m2,p_confirmed_concrete_m3,nullif(trim(coalesce(p_evidence_ref,'')),''),nullif(trim(coalesce(p_note,'')),''),v_candidate_ready
  ) returning * into v_existing;
  return jsonb_build_object('ok',true,'submission_id',v_existing.id,'candidate_ready',v_existing.candidate_ready,'site_id',v_existing.site_id,'batch_id',v_existing.batch_id,'submitted_at',v_existing.submitted_at);
end;
$$;

create or replace function public.drying_yard_review_site_readiness(
  p_request_id uuid,p_project_id uuid,p_submission_id uuid,p_decision text,
  p_reviewed_by_user_id text,p_reviewed_by_email text,p_reviewed_by_name text,p_reviewed_by_role text,p_review_reason text
) returns jsonb language plpgsql security definer set search_path=public as $$
declare
  v_existing public.drying_yard_site_readiness_reviews%rowtype;
  v_submission public.drying_yard_site_readiness_submissions%rowtype;
  v_batch public.drying_yard_batch_releases%rowtype;
  v_batch_site public.drying_yard_batch_release_sites%rowtype;
  v_latest_submission_id uuid;
  v_snapshot jsonb;
begin
  select * into v_existing from public.drying_yard_site_readiness_reviews where request_id=p_request_id;
  if found then return jsonb_build_object('ok',true,'idempotent',true,'review_id',v_existing.id,'decision',v_existing.decision); end if;
  if p_reviewed_by_role not in ('EXECUTIVE','ADMIN') then raise exception 'REVIEWER_ROLE_BLOCK'; end if;
  if p_decision not in ('accepted','rejected') then raise exception 'INVALID_REVIEW_DECISION'; end if;
  if char_length(trim(coalesce(p_review_reason,'')))<8 then raise exception 'REVIEW_REASON_REQUIRED'; end if;
  if nullif(trim(coalesce(p_reviewed_by_user_id,'')),'') is null or nullif(trim(coalesce(p_reviewed_by_email,'')),'') is null or nullif(trim(coalesce(p_reviewed_by_name,'')),'') is null then raise exception 'REVIEWER_IDENTITY_REQUIRED'; end if;
  select * into v_submission from public.drying_yard_site_readiness_submissions where id=p_submission_id and project_id=p_project_id for share;
  if not found then raise exception 'SUBMISSION_NOT_FOUND'; end if;
  if exists(select 1 from public.drying_yard_site_readiness_reviews where submission_id=p_submission_id) then raise exception 'SUBMISSION_ALREADY_REVIEWED'; end if;
  select id into v_latest_submission_id from public.drying_yard_site_readiness_submissions
    where project_id=p_project_id and batch_id=v_submission.batch_id and site_id=v_submission.site_id order by submitted_at desc,id desc limit 1;
  if v_latest_submission_id is distinct from p_submission_id then raise exception 'STALE_SUBMISSION_BLOCK'; end if;
  select * into v_batch from public.drying_yard_batch_releases where id=v_submission.batch_id and project_id=p_project_id for update;
  if not found then raise exception 'BATCH_NOT_FOUND'; end if;
  if v_batch.status in ('released','in_progress','completed','cancelled') then raise exception 'BATCH_READINESS_LOCKED'; end if;
  select * into v_batch_site from public.drying_yard_batch_release_sites where batch_id=v_submission.batch_id and site_id=v_submission.site_id for update;
  if not found then raise exception 'BATCH_SITE_NOT_FOUND'; end if;
  if p_decision='accepted' then
    if not v_submission.candidate_ready then raise exception 'CANDIDATE_NOT_READY'; end if;
    update public.drying_yard_batch_release_sites set
      quantity_confirmed=v_submission.quantity_confirmed,drawing_confirmed=v_submission.drawing_confirmed,
      site_condition_confirmed=v_submission.site_condition_confirmed,access_ready=v_submission.access_ready,
      confirmed_area_m2=v_submission.confirmed_area_m2,confirmed_concrete_m3=v_submission.confirmed_concrete_m3,
      evidence_ref=v_submission.evidence_ref,readiness_note=v_submission.note,readiness_status='ready',
      readiness_checked_by_user_id=trim(p_reviewed_by_user_id),readiness_checked_by_email=lower(trim(p_reviewed_by_email)),readiness_checked_at=now(),updated_at=now()
    where id=v_batch_site.id returning * into v_batch_site;
  end if;
  v_snapshot := jsonb_build_object('submission',to_jsonb(v_submission),'resulting_batch_site',case when p_decision='accepted' then to_jsonb(v_batch_site) else '{}'::jsonb end);
  insert into public.drying_yard_site_readiness_reviews(
    request_id,submission_id,project_id,batch_id,site_id,decision,reviewed_by_user_id,reviewed_by_email,reviewed_by_name,reviewed_by_role,review_reason,snapshot
  ) values (
    p_request_id,p_submission_id,p_project_id,v_submission.batch_id,v_submission.site_id,p_decision,trim(p_reviewed_by_user_id),lower(trim(p_reviewed_by_email)),trim(p_reviewed_by_name),p_reviewed_by_role,trim(p_review_reason),v_snapshot
  ) returning * into v_existing;
  return jsonb_build_object('ok',true,'review_id',v_existing.id,'decision',v_existing.decision,'site_id',v_existing.site_id,'batch_id',v_existing.batch_id,'readiness_status',case when p_decision='accepted' then 'ready' else v_batch_site.readiness_status end);
end;
$$;

revoke all on public.drying_yard_site_readiness_submissions from anon,authenticated;
revoke all on public.drying_yard_site_readiness_reviews from anon,authenticated;
revoke execute on function public.drying_yard_submit_site_readiness(uuid,uuid,uuid,uuid,text,text,text,text,boolean,boolean,boolean,boolean,numeric,numeric,text,text) from public,anon,authenticated;
revoke execute on function public.drying_yard_review_site_readiness(uuid,uuid,uuid,text,text,text,text,text,text) from public,anon,authenticated;
grant execute on function public.drying_yard_submit_site_readiness(uuid,uuid,uuid,uuid,text,text,text,text,boolean,boolean,boolean,boolean,numeric,numeric,text,text) to service_role;
grant execute on function public.drying_yard_review_site_readiness(uuid,uuid,uuid,text,text,text,text,text,text) to service_role;
