-- Run AFTER all 18 files. Every row should say true (the last row, 18 files, says how many
-- of the markers are present). Safe to run any time: it only reads.
select 'extra_locations column'      as check, exists(select 1 from information_schema.columns where table_name='platform_subscriptions' and column_name='extra_locations') as ok
union all select 'cancel_at column', exists(select 1 from information_schema.columns where table_name='platform_subscriptions' and column_name='cancel_at')
union all select 'grace_until column', exists(select 1 from information_schema.columns where table_name='platform_subscriptions' and column_name='grace_until')
union all select 'paddle_event_at column', exists(select 1 from information_schema.columns where table_name='platform_subscriptions' and column_name='paddle_event_at')
union all select 'legacy_unbilled_tenants table', to_regclass('public.legacy_unbilled_tenants') is not null
union all select 'account deletion functions', exists(select 1 from pg_proc where proname='account_delete_gym') and exists(select 1 from pg_proc where proname='account_delete_user')
union all select 'invoices.tax_breakdown', exists(select 1 from information_schema.columns where table_name='invoices' and column_name='tax_breakdown')
union all select 'pos_sales.tax_breakdown', exists(select 1 from information_schema.columns where table_name='pos_sales' and column_name='tax_breakdown')
union all select 'door device keys table', to_regclass('public.attendance_device_keys') is not null
union all select 'gyms by country function', exists(select 1 from pg_proc where proname='platform_gyms_by_country')
union all select 'members.plan_id', exists(select 1 from information_schema.columns where table_name='members' and column_name='plan_id')
union all select 'assign_member_plan function', exists(select 1 from pg_proc where proname='assign_member_plan')
union all select 'tenant_roles table', to_regclass('public.tenant_roles') is not null
union all select 'has_permission function', exists(select 1 from pg_proc where proname='has_permission')
union all select 'member search indexes', (select count(*) from pg_indexes where indexname in ('idx_members_first_name_trgm','idx_members_last_name_trgm','idx_members_email_trgm','idx_members_phone_trgm','idx_members_tenant_name','idx_members_tenant_created'))=6
union all select 'both existing gyms still have a subscription', (select count(*) from public.tenants t where not exists (select 1 from public.platform_subscriptions s where s.tenant_id=t.id))=0;
