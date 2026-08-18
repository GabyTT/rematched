-- The initial seller-access migration escaped the leading plus sign twice.
-- Keep the E.164 rule, but match a literal plus correctly in PostgreSQL.

alter table public.seller_accounts
  drop constraint seller_accounts_phone_e164_check;

alter table public.seller_accounts
  add constraint seller_accounts_phone_e164_check check (
    phone_e164 ~ '^\+[1-9][0-9]{7,14}$'
  );
