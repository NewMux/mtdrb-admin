-- Public storage bucket for gym logos (branding assets are meant to be
-- displayed directly via a public URL, unlike the private financial
-- document buckets in 20260814074507_secure_financial_storage.sql).
-- Being a public bucket, reads bypass RLS via the public object URL;
-- only writes need policies.

BEGIN;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  (
    'gym-logos',
    'gym-logos',
    true,
    5242880,
    ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/svg+xml', 'image/webp']::text[]
  )
ON CONFLICT (id) DO UPDATE
SET
  public = true,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Anyone can view gym logos" ON storage.objects;
DROP POLICY IF EXISTS "Tenant admins can upload gym logos" ON storage.objects;
DROP POLICY IF EXISTS "Tenant admins can update gym logos" ON storage.objects;
DROP POLICY IF EXISTS "Tenant admins can delete gym logos" ON storage.objects;

CREATE POLICY "Anyone can view gym logos"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'gym-logos');

CREATE POLICY "Tenant admins can upload gym logos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'gym-logos'
  AND (storage.foldername(name))[1] = 'logos'
  AND public.storage_tenant_id(name) = public.get_user_tenant_id()
  AND public.has_tenant_role(public.get_user_tenant_id(), 'admin')
);

CREATE POLICY "Tenant admins can update gym logos"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'gym-logos'
  AND (storage.foldername(name))[1] = 'logos'
  AND public.storage_tenant_id(name) = public.get_user_tenant_id()
  AND public.has_tenant_role(public.get_user_tenant_id(), 'admin')
)
WITH CHECK (
  bucket_id = 'gym-logos'
  AND (storage.foldername(name))[1] = 'logos'
  AND public.storage_tenant_id(name) = public.get_user_tenant_id()
  AND public.has_tenant_role(public.get_user_tenant_id(), 'admin')
);

CREATE POLICY "Tenant admins can delete gym logos"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'gym-logos'
  AND (storage.foldername(name))[1] = 'logos'
  AND public.storage_tenant_id(name) = public.get_user_tenant_id()
  AND public.has_tenant_role(public.get_user_tenant_id(), 'admin')
);

COMMIT;
