-- Private, tenant-scoped storage bucket for task completion attachments,
-- matching the pattern already established for expense-receipts/invoice-files
-- in 20260814074507_secure_financial_storage.sql.

BEGIN;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  (
    'task-attachments',
    'task-attachments',
    false,
    10485760,
    ARRAY['image/jpeg', 'image/png', 'image/gif', 'application/pdf']::text[]
  )
ON CONFLICT (id) DO UPDATE
SET
  public = false,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Tenant users can upload task attachments" ON storage.objects;
DROP POLICY IF EXISTS "Tenant users can read task attachments" ON storage.objects;
DROP POLICY IF EXISTS "Tenant employees can update task attachments" ON storage.objects;
DROP POLICY IF EXISTS "Tenant employees can delete task attachments" ON storage.objects;

CREATE POLICY "Tenant users can upload task attachments"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'task-attachments'
  AND (storage.foldername(name))[1] = 'attachments'
  AND public.storage_tenant_id(name) = public.get_user_tenant_id()
  AND public.has_tenant_role(public.get_user_tenant_id(), 'employee')
);

CREATE POLICY "Tenant users can read task attachments"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'task-attachments'
  AND (storage.foldername(name))[1] = 'attachments'
  AND public.storage_tenant_id(name) = public.get_user_tenant_id()
);

CREATE POLICY "Tenant employees can update task attachments"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'task-attachments'
  AND (storage.foldername(name))[1] = 'attachments'
  AND public.storage_tenant_id(name) = public.get_user_tenant_id()
  AND public.has_tenant_role(public.get_user_tenant_id(), 'employee')
)
WITH CHECK (
  bucket_id = 'task-attachments'
  AND (storage.foldername(name))[1] = 'attachments'
  AND public.storage_tenant_id(name) = public.get_user_tenant_id()
  AND public.has_tenant_role(public.get_user_tenant_id(), 'employee')
);

CREATE POLICY "Tenant employees can delete task attachments"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'task-attachments'
  AND (storage.foldername(name))[1] = 'attachments'
  AND public.storage_tenant_id(name) = public.get_user_tenant_id()
  AND public.has_tenant_role(public.get_user_tenant_id(), 'employee')
);

COMMIT;
