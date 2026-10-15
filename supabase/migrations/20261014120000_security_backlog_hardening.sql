-- Security backlog hardening (AUDIT_2026-09.md: M3 + LOW items)
-- ============================================================================
-- Closes the database-side items from the September 2026 audit's MEDIUM
-- "Security" and LOW backlog that are fixable in SQL. Every policy below is
-- based on the latest definition of that table's policies in this
-- directory (or schema.sql where the migrations don't define the table),
-- not on guessed column names:
--
--   activities    -> 20260814074442_harden_authorization.sql (policies),
--                    schema.sql (columns: tenant_id, type, title,
--                    description, "user", amount, status, metadata),
--                    20260823160000_allow_login_activity_type.sql (type CHECK)
--   tasks         -> 20260814083241_post_audit_hardening.sql (policies),
--                    006_create_tasks_table.sql (columns incl. created_by)
--   notifications -> 003_create_notifications_table.sql (policies, columns)
--   has_tenant_role -> 20260814074442_harden_authorization.sql
--
-- NOT VERIFIED AGAINST THE LIVE DATABASE. This migration was written
-- without access to the live Supabase project. Before/after applying it,
-- check pg_policies for activities/tasks/notifications and
-- information_schema.routine_privileges for the trigger functions on the
-- live project (or a Supabase branch of it), run get_advisors, and smoke
-- test: (a) sign in as a trainer, an employee and an admin and confirm a
-- 'login' row lands in activities for each; (b) cancel a membership as an
-- employee and confirm the 'member' activity row lands; (c) create, edit,
-- complete and delete a task as a trainer; (d) mark a notification read as
-- a trainer.
--
-- 1. activities INSERT is role- and type-gated (audit M3).
--    Was: activities_insert_same_tenant only checked tenant_id, so any staff
--    member (including a trainer) could insert any activity type with any
--    "user" attribution - i.e. forge audit entries such as "Payment
--    Processed" or attribute an entry to a colleague. Now, per type:
--      * 'login'                                  -> any staff role, but
--        "user" must be the caller's own email (JWT claim) or auth.uid(),
--        and metadata/amount must be empty. This is exactly what
--        src/pages/Login.tsx inserts (user: user.email || user.id) right
--        after sign-in, so login logging keeps working for every role.
--      * 'class', 'booking'                       -> trainer and above
--        (classes/bookings are trainer-writable tables; the client's
--        transactionService logs 'class' rows).
--      * 'member', 'payment', 'signup', 'renewal' -> employee and above
--        (members/invoices are employee-writable tables;
--        transactionService logs 'member'/'payment' rows from the
--        employee-only /members and /billing flows).
--    For every type, "user" (when set) must be the caller - no
--    attributing rows to someone else. UPDATE/DELETE remain without any
--    policy (deny-all), so the log stays append-only for clients. The
--    service role bypasses RLS and is unaffected. The type CHECK
--    constraint is unchanged; note it does not include 'subscription', so
--    CancelSubscriptionModal's 'subscription' insert was already being
--    rejected by the constraint before this migration and still is.
--
-- 2. tasks writes get a role gate (audit LOW).
--    Was: tenant-scoped only. The /tasks route is open to every staff role
--    (PermissionGuard requiredRole="trainer") and useSmartTaskModal lets
--    any of them create, edit, complete, reassign, archive and delete, so
--    writes are gated at has_tenant_role(..., 'trainer') - matching how
--    the app uses the table, in the same per-command shape as the
--    harden_authorization policies. INSERT additionally requires
--    created_by to be NULL or the caller (the app always sends
--    created_by: user.id), so a task can't be attributed to someone else.
--
-- 3. notifications writes get a role gate (audit LOW).
--    Was: tenant-scoped only (via a memberships subquery, and with no
--    TO authenticated). The app only ever reads notifications and marks
--    them read (src/components/TopBar.tsx, shown to every role); nothing
--    in the client inserts or deletes them. So: SELECT stays tenant-scoped,
--    UPDATE (mark read) is any staff role, INSERT/DELETE are admin-only.
--    Policies now use get_user_tenant_id(), like every other tenant table.
--
-- 4. Trigger-only functions lose default PUBLIC/anon/authenticated EXECUTE
--    (audit LOW). Same reasoning as
--    20260823130000_restrict_trigger_function_execute.sql: these are
--    BEFORE UPDATE updated_at triggers, callable as /rest/v1/rpc/... by
--    default, and trigger firing does not depend on the invoking role
--    holding EXECUTE. Revoked from anon/authenticated explicitly as well as
--    PUBLIC because Supabase's default privileges grant EXECUTE to each
--    role directly (see 20260909155023_revoke_anon_execute_on_is_tenant_entitled.sql).
--    Functions: update_updated_at_column, update_tasks_updated_at,
--    update_notifications_updated_at, update_platform_subscriptions_updated_at,
--    update_pos_updated_at. Each revoke is skipped if the function doesn't
--    exist in the target database.
--
-- 5. has_tenant_role is deterministic (audit LOW).
--    Was: SELECT role ... LIMIT 1 with no ORDER BY. schema.sql has
--    UNIQUE(user_id, tenant_id) on memberships so there should only ever
--    be one row, but if a duplicate ever exists the result depended on
--    heap order. Now takes the highest-ranked role among the caller's
--    membership rows for that tenant (an admin with a stale duplicate
--    trainer row stays an admin; unknown role strings still rank 0).
--    Same signature, SECURITY DEFINER, search_path and grants.
--
-- Not in this migration (see AUDIT_2026-09.md): M4 get_lockout_threshold
-- rate limiting already landed in 20260911102707_add_rate_limiting.sql;
-- M5 (server-side password policy) is a Supabase dashboard Auth setting,
-- not SQL.
-- ============================================================================

BEGIN;

-- --------------------------------------------------------------------------
-- 5. Deterministic has_tenant_role (defined first: the policies use it)
-- --------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.has_tenant_role(
  p_tenant_id uuid,
  p_required_role text
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_required_rank integer;
  v_role_rank integer;
BEGIN
  IF (SELECT auth.uid()) IS NULL OR p_tenant_id IS NULL THEN
    RETURN false;
  END IF;

  v_required_rank := CASE p_required_role
    WHEN 'trainer' THEN 1
    WHEN 'employee' THEN 2
    WHEN 'admin' THEN 3
    ELSE 99
  END;

  -- Highest-privilege matching row wins; deterministic regardless of
  -- physical row order. No rows -> NULL -> 0.
  SELECT max(
    CASE m.role
      WHEN 'trainer' THEN 1
      WHEN 'employee' THEN 2
      WHEN 'admin' THEN 3
      ELSE 0
    END
  )
  INTO v_role_rank
  FROM public.memberships AS m
  WHERE m.user_id = (SELECT auth.uid())
    AND m.tenant_id = p_tenant_id;

  RETURN COALESCE(v_role_rank, 0) >= v_required_rank;
END;
$$;

REVOKE ALL ON FUNCTION public.has_tenant_role(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_tenant_role(uuid, text) TO authenticated;

-- --------------------------------------------------------------------------
-- 1. activities: role- and type-gated INSERT
-- --------------------------------------------------------------------------

ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS activities_insert_same_tenant ON public.activities;
DROP POLICY IF EXISTS activities_insert_role_gated ON public.activities;

CREATE POLICY activities_insert_role_gated
  ON public.activities FOR INSERT TO authenticated
  WITH CHECK (
    tenant_id = public.get_user_tenant_id()
    -- Attribution, when present, must be the caller (email or user id).
    AND (
      "user" IS NULL
      OR lower("user") = lower((SELECT auth.jwt()) ->> 'email')
      OR "user" = (SELECT auth.uid())::text
    )
    AND (
      (
        type = 'login'
        AND public.has_tenant_role(tenant_id, 'trainer')
        AND "user" IS NOT NULL
        AND amount IS NULL
        AND COALESCE(metadata, '{}'::jsonb) = '{}'::jsonb
      )
      OR (
        type IN ('class', 'booking')
        AND public.has_tenant_role(tenant_id, 'trainer')
      )
      OR (
        type IN ('member', 'payment', 'signup', 'renewal')
        AND public.has_tenant_role(tenant_id, 'employee')
      )
    )
  );

-- activities_select_same_tenant (harden_authorization) is unchanged.
-- No UPDATE/DELETE policies: the activity log is append-only for clients.

-- --------------------------------------------------------------------------
-- 2. tasks: role-gated writes
-- --------------------------------------------------------------------------

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view tasks for their tenant" ON public.tasks;
DROP POLICY IF EXISTS "Users can insert tasks for their tenant" ON public.tasks;
DROP POLICY IF EXISTS "Users can update tasks for their tenant" ON public.tasks;
DROP POLICY IF EXISTS "Users can delete tasks for their tenant" ON public.tasks;
DROP POLICY IF EXISTS tasks_select_same_tenant ON public.tasks;
DROP POLICY IF EXISTS tasks_insert_trainer ON public.tasks;
DROP POLICY IF EXISTS tasks_update_trainer ON public.tasks;
DROP POLICY IF EXISTS tasks_delete_trainer ON public.tasks;

CREATE POLICY tasks_select_same_tenant
  ON public.tasks FOR SELECT TO authenticated
  USING (tenant_id = public.get_user_tenant_id());
CREATE POLICY tasks_insert_trainer
  ON public.tasks FOR INSERT TO authenticated
  WITH CHECK (
    tenant_id = public.get_user_tenant_id()
    AND public.has_tenant_role(tenant_id, 'trainer')
    AND (created_by IS NULL OR created_by = (SELECT auth.uid()))
  );
CREATE POLICY tasks_update_trainer
  ON public.tasks FOR UPDATE TO authenticated
  USING (tenant_id = public.get_user_tenant_id() AND public.has_tenant_role(tenant_id, 'trainer'))
  WITH CHECK (tenant_id = public.get_user_tenant_id() AND public.has_tenant_role(tenant_id, 'trainer'));
CREATE POLICY tasks_delete_trainer
  ON public.tasks FOR DELETE TO authenticated
  USING (tenant_id = public.get_user_tenant_id() AND public.has_tenant_role(tenant_id, 'trainer'));

-- --------------------------------------------------------------------------
-- 3. notifications: role-gated writes
-- --------------------------------------------------------------------------

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view notifications for their tenant" ON public.notifications;
DROP POLICY IF EXISTS "Users can insert notifications for their tenant" ON public.notifications;
DROP POLICY IF EXISTS "Users can update notifications for their tenant" ON public.notifications;
DROP POLICY IF EXISTS "Users can delete notifications for their tenant" ON public.notifications;
DROP POLICY IF EXISTS notifications_select_same_tenant ON public.notifications;
DROP POLICY IF EXISTS notifications_insert_admin ON public.notifications;
DROP POLICY IF EXISTS notifications_update_trainer ON public.notifications;
DROP POLICY IF EXISTS notifications_delete_admin ON public.notifications;

CREATE POLICY notifications_select_same_tenant
  ON public.notifications FOR SELECT TO authenticated
  USING (tenant_id = public.get_user_tenant_id());
CREATE POLICY notifications_insert_admin
  ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (tenant_id = public.get_user_tenant_id() AND public.has_tenant_role(tenant_id, 'admin'));
CREATE POLICY notifications_update_trainer
  ON public.notifications FOR UPDATE TO authenticated
  USING (tenant_id = public.get_user_tenant_id() AND public.has_tenant_role(tenant_id, 'trainer'))
  WITH CHECK (tenant_id = public.get_user_tenant_id() AND public.has_tenant_role(tenant_id, 'trainer'));
CREATE POLICY notifications_delete_admin
  ON public.notifications FOR DELETE TO authenticated
  USING (tenant_id = public.get_user_tenant_id() AND public.has_tenant_role(tenant_id, 'admin'));

-- --------------------------------------------------------------------------
-- 4. Trigger-only functions: no direct RPC execution
-- --------------------------------------------------------------------------

DO $$
DECLARE
  v_fn text;
BEGIN
  FOREACH v_fn IN ARRAY ARRAY[
    'public.update_updated_at_column()',
    'public.update_tasks_updated_at()',
    'public.update_notifications_updated_at()',
    'public.update_platform_subscriptions_updated_at()',
    'public.update_pos_updated_at()'
  ] LOOP
    IF to_regprocedure(v_fn) IS NOT NULL THEN
      EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon, authenticated', v_fn);
    END IF;
  END LOOP;
END;
$$;

COMMIT;
