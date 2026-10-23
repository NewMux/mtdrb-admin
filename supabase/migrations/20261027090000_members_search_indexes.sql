-- Fast member lists for big gyms.
--
-- The members page now searches and pages in the database: name / email / phone
-- ILIKE '%word%' (trigram indexes make that fast instead of reading every row),
-- ordered by name, with the default newest-first order for the dashboard. Safe to
-- run at any time; creating an index takes a short lock on a small table, so for a
-- very large production table run it in a quiet period.

BEGIN;

CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA extensions;

CREATE INDEX IF NOT EXISTS idx_members_first_name_trgm ON public.members USING gin (first_name extensions.gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_members_last_name_trgm  ON public.members USING gin (last_name extensions.gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_members_email_trgm      ON public.members USING gin (email extensions.gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_members_phone_trgm      ON public.members USING gin (phone extensions.gin_trgm_ops);

-- The default page order (by name) and the dashboard's newest-first list.
CREATE INDEX IF NOT EXISTS idx_members_tenant_name    ON public.members (tenant_id, first_name, last_name, id);
CREATE INDEX IF NOT EXISTS idx_members_tenant_created ON public.members (tenant_id, created_at DESC, id);

COMMIT;
