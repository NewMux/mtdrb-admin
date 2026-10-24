# Pending database migrations (18 files)

These are the migrations your live Supabase project (`mtdrb-admin`) does not have yet, checked on
2026-10-24. The files here are copies of `supabase/migrations/<same name>`; the numbers just give
the order.

## How to apply (Supabase dashboard -> SQL Editor)

1. **Before anything:** Supabase -> Database -> Backups. Confirm a recent backup or take one.
2. For each file, **in the order 01 -> 18**: open it, paste the whole file into a new SQL Editor
   query, press Run. Wait for "Success" before the next file. Supabase may warn about
   "destructive operations" (they are `DROP ... IF EXISTS` / function bodies); that is expected.
3. If a file fails: stop. Nothing from that file is kept (each is one transaction). Send me the
   error text and which file it was; do not skip it, later files depend on earlier ones.
4. After file 18, run `verify.sql`. Every row must say `true`.

Do **not** use `supabase db push`: your project's recorded history uses different version numbers
than these filenames, so the CLI would try to run files that are effectively already applied.

## Optional: record them in the migration history

Running files in the SQL Editor does not add them to `supabase_migrations.schema_migrations`.
That only matters if you later use the CLI. To keep the history honest, run once after verify.sql:

```sql
insert into supabase_migrations.schema_migrations (version, name) values
 ('20261022090000','add_extra_locations'),
 ('20261022120000','cancel_at_and_billing_only_writes'),
 ('20261022150000','past_due_grace'),
 ('20261022180000','pos_currency_decimals'),
 ('20261022200000','paddle_event_ordering'),
 ('20261022210000','console_past_due_state'),
 ('20261023090000','new_gyms_need_a_subscription'),
 ('20261024090000','self_service_account_deletion'),
 ('20261024120000','multiple_taxes'),
 ('20261024150000','access_control'),
 ('20261024180000','platform_gyms_by_country'),
 ('20261024210000','gyms_list_country_filter'),
 ('20261024230000','pos_return_tax'),
 ('20261025090000','membership_plans'),
 ('20261025100000','money_columns_three_decimals'),
 ('20261025110000','plan_invoice'),
 ('20261026090000','custom_roles'),
 ('20261027090000','members_search_indexes')
on conflict do nothing;
```

## What comes after the database

Edge Functions (deploy all seven: `paddle-webhook`, `paddle-manage-locations`,
`paddle-cancel-subscription`, `delete-account`, `platform-invite-gym`, `invite-staff`,
`attendance-ingest`), then the frontend. See `DEPLOYMENT.md` -> "Go-live runbook".

## Already checked on your live project (read-only)

- 2 gyms (Testing Gym, MTDRB); both already have a subscription row, so file 07
  (`new_gyms_need_a_subscription`) does not lock either of them out.
- Owner console, three-decimal money columns and "invite a gym" are already in production, so
  they are not in this list.
