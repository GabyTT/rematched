\set ON_ERROR_STOP on

begin;

do $$
begin
  if exists (
    select 1
    from public.normalized_listings as listings
    where listings.workflow_status = 'live'
      and not exists (
        select 1
        from public.buyer_visible_listings as visible
        where visible.id = listings.id
      )
  ) then
    raise exception 'Every Live listing must be present in buyer_visible_listings.';
  end if;

  if exists (
    select 1
    from public.normalized_listings as listings
    join public.seller_listing_submissions as submissions
      on submissions.normalized_listing_id = listings.id
    where listings.workflow_status = 'live'
      and submissions.status = 'submitted'
      and submissions.admin_review_status = 'pending'
      and not exists (
        select 1
        from public.buyer_visible_listings as visible
        where visible.id = listings.id
      )
  ) then
    raise exception 'A pending seller update must not hide the current Live listing from buyers.';
  end if;
end;
$$;

rollback;
