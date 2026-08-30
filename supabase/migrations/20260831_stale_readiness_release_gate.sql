create or replace function public.drying_yard_block_stale_readiness_release()
returns trigger
language plpgsql
set search_path=public
as $$
begin
  if new.status='released' and old.status is distinct from 'released' then
    if exists (
      select 1
      from public.drying_yard_batch_release_sites bs
      join lateral (
        select s.id,s.submitted_at
        from public.drying_yard_site_readiness_submissions s
        where s.project_id=new.project_id
          and s.batch_id=new.id
          and s.site_id=bs.site_id
        order by s.submitted_at desc,s.id desc
        limit 1
      ) latest on true
      left join public.drying_yard_site_readiness_reviews r
        on r.submission_id=latest.id
      where bs.batch_id=new.id
        and r.id is null
    ) then
      raise exception 'STALE_FIELD_READINESS_REVIEW_REQUIRED';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_drying_yard_block_stale_readiness_release on public.drying_yard_batch_releases;
create trigger trg_drying_yard_block_stale_readiness_release
before update of status on public.drying_yard_batch_releases
for each row execute function public.drying_yard_block_stale_readiness_release();
