-- ============================================================================
-- MTDRB SECURITY MIGRATION 009
-- Private, tenant-scoped storage for financial documents.
-- Run after migrations/008_harden_authorization.sql.
-- ============================================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.storage_tenant_id(p_name text)
RETURNS uuid
LANGUAGE plpgsql
IMMUTABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_tenant_segment text;
BEGIN
  v_tenant_segment := (storage.foldername(p_name))[2];
  IF v_tenant_segment IS NULL
     OR v_tenant_segment !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' THEN
    RETURN NULL;
  END IF;
  RETURN v_tenant_segment::uuid;
END;
$$;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  (
    'expense-receipts',
    'expense-receipts',
    false,
    10485760,
    ARRAY['image/jpeg', 'image/png', 'image/gif', 'application/pdf']::text[]
  ),
  (
    'invoice-files',
    'invoice-files',
    false,
    10485760,
    ARRAY['image/jpeg', 'image/png', 'image/gif', 'application/pdf']::text[]
  )
ON CONFLICT (id) DO UPDATE
SET
  public = false,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Tenant users can upload expense receipts" ON storage.objects;
DROP POLICY IF EXISTS "Tenant users can read expense receipts" ON storage.objects;
DROP POLICY IF EXISTS "Tenant employees can update expense receipts" ON storage.objects;
DROP POLICY IF EXISTS "Tenant employees can delete expense receipts" ON storage.objects;
DROP POLICY IF EXISTS "Tenant users can upload invoice files" ON storage.objects;
DROP POLICY IF EXISTS "Tenant users can read invoice files" ON storage.objects;
DROP POLICY IF EXISTS "Tenant employees can update invoice files" ON storage.objects;
DROP POLICY IF EXISTS "Tenant employees can delete invoice files" ON storage.objects;

CREATE POLICY "Tenant users can upload expense receipts"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'expense-receipts'
  AND (storage.foldername(name))[1] = 'receipts'
  AND public.storage_tenant_id(name) = public.get_user_tenant_id()
  AND public.has_tenant_role(public.get_user_tenant_id(), 'employee')
);

CREATE POLICY "Tenant users can read expense receipts"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'expense-receipts'
  AND (storage.foldername(name))[1] = 'receipts'
  AND public.storage_tenant_id(name) = public.get_user_tenant_id()
);

CREATE POLICY "Tenant employees can update expense receipts"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'expense-receipts'
  AND (storage.foldername(name))[1] = 'receipts'
  AND public.storage_tenant_id(name) = public.get_user_tenant_id()
  AND public.has_tenant_role(public.get_user_tenant_id(), 'employee')
)
WITH CHECK (
  bucket_id = 'expense-receipts'
  AND (storage.foldername(name))[1] = 'receipts'
  AND public.storage_tenant_id(name) = public.get_user_tenant_id()
  AND public.has_tenant_role(public.get_user_tenant_id(), 'employee')
);

CREATE POLICY "Tenant employees can delete expense receipts"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'expense-receipts'
  AND (storage.foldername(name))[1] = 'receipts'
  AND public.storage_tenant_id(name) = public.get_user_tenant_id()
  AND public.has_tenant_role(public.get_user_tenant_id(), 'employee')
);

CREATE POLICY "Tenant users can upload invoice files"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'invoice-files'
  AND (storage.foldername(name))[1] = 'invoices'
  AND public.storage_tenant_id(name) = public.get_user_tenant_id()
  AND public.has_tenant_role(public.get_user_tenant_id(), 'employee')
);

CREATE POLICY "Tenant users can read invoice files"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'invoice-files'
  AND (storage.foldername(name))[1] = 'invoices'
  AND public.storage_tenant_id(name) = public.get_user_tenant_id()
);

CREATE POLICY "Tenant employees can update invoice files"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'invoice-files'
  AND (storage.foldername(name))[1] = 'invoices'
  AND public.storage_tenant_id(name) = public.get_user_tenant_id()
  AND public.has_tenant_role(public.get_user_tenant_id(), 'employee')
)
WITH CHECK (
  bucket_id = 'invoice-files'
  AND (storage.foldername(name))[1] = 'invoices'
  AND public.storage_tenant_id(name) = public.get_user_tenant_id()
  AND public.has_tenant_role(public.get_user_tenant_id(), 'employee')
);

CREATE POLICY "Tenant employees can delete invoice files"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'invoice-files'
  AND (storage.foldername(name))[1] = 'invoices'
  AND public.storage_tenant_id(name) = public.get_user_tenant_id()
  AND public.has_tenant_role(public.get_user_tenant_id(), 'employee')
);

REVOKE ALL ON FUNCTION public.storage_tenant_id(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.storage_tenant_id(text) TO authenticated;

COMMIT;
