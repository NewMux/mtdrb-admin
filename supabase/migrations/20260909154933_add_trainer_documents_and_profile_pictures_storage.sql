-- Two storage buckets the app already uploads to but that were never
-- created: `trainer-documents` (AddTrainerModal.tsx) and
-- `profile-pictures` (Settings.tsx). Both uploads were failing in
-- production with no bucket to write to - not an open bucket, a missing
-- one. Follows the same patterns already established:
-- 20260814074507_secure_financial_storage.sql (private, tenant-scoped)
-- and 20260824033000_add_gym_logos_storage.sql (public read, tenant-
-- scoped admin write).

BEGIN;

-- trainer-documents: private. Holds certifications, national ID scans,
-- and profile images uploaded when adding a trainer - not meant to be
-- publicly readable.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  (
    'trainer-documents',
    'trainer-documents',
    false,
    10485760,
    ARRAY[
      'image/jpeg', 'image/png',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]::text[]
  )
ON CONFLICT (id) DO UPDATE
SET
  public = false,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Tenant employees can upload trainer documents" ON storage.objects;
DROP POLICY IF EXISTS "Tenant users can read trainer documents" ON storage.objects;
DROP POLICY IF EXISTS "Tenant employees can update trainer documents" ON storage.objects;
DROP POLICY IF EXISTS "Tenant employees can delete trainer documents" ON storage.objects;

CREATE POLICY "Tenant employees can upload trainer documents"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'trainer-documents'
  AND (storage.foldername(name))[1] = 'documents'
  AND public.storage_tenant_id(name) = public.get_user_tenant_id()
  AND public.has_tenant_role(public.get_user_tenant_id(), 'employee')
);

CREATE POLICY "Tenant users can read trainer documents"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'trainer-documents'
  AND (storage.foldername(name))[1] = 'documents'
  AND public.storage_tenant_id(name) = public.get_user_tenant_id()
);

CREATE POLICY "Tenant employees can update trainer documents"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'trainer-documents'
  AND (storage.foldername(name))[1] = 'documents'
  AND public.storage_tenant_id(name) = public.get_user_tenant_id()
  AND public.has_tenant_role(public.get_user_tenant_id(), 'employee')
)
WITH CHECK (
  bucket_id = 'trainer-documents'
  AND (storage.foldername(name))[1] = 'documents'
  AND public.storage_tenant_id(name) = public.get_user_tenant_id()
  AND public.has_tenant_role(public.get_user_tenant_id(), 'employee')
);

CREATE POLICY "Tenant employees can delete trainer documents"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'trainer-documents'
  AND (storage.foldername(name))[1] = 'documents'
  AND public.storage_tenant_id(name) = public.get_user_tenant_id()
  AND public.has_tenant_role(public.get_user_tenant_id(), 'employee')
);

-- profile-pictures: public read (avatars are displayed via a direct
-- public URL, same rationale as gym-logos), tenant-admin write. The
-- Settings page that uploads to it is itself route-gated to admin and
-- above (see App.tsx), so the write policy mirrors that exactly.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  (
    'profile-pictures',
    'profile-pictures',
    true,
    5242880,
    ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']::text[]
  )
ON CONFLICT (id) DO UPDATE
SET
  public = true,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Anyone can view profile pictures" ON storage.objects;
DROP POLICY IF EXISTS "Tenant admins can upload profile pictures" ON storage.objects;
DROP POLICY IF EXISTS "Tenant admins can update profile pictures" ON storage.objects;
DROP POLICY IF EXISTS "Tenant admins can delete profile pictures" ON storage.objects;

CREATE POLICY "Anyone can view profile pictures"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'profile-pictures');

CREATE POLICY "Tenant admins can upload profile pictures"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'profile-pictures'
  AND (storage.foldername(name))[1] = 'profile-pictures'
  AND public.storage_tenant_id(name) = public.get_user_tenant_id()
  AND public.has_tenant_role(public.get_user_tenant_id(), 'admin')
);

CREATE POLICY "Tenant admins can update profile pictures"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'profile-pictures'
  AND (storage.foldername(name))[1] = 'profile-pictures'
  AND public.storage_tenant_id(name) = public.get_user_tenant_id()
  AND public.has_tenant_role(public.get_user_tenant_id(), 'admin')
)
WITH CHECK (
  bucket_id = 'profile-pictures'
  AND (storage.foldername(name))[1] = 'profile-pictures'
  AND public.storage_tenant_id(name) = public.get_user_tenant_id()
  AND public.has_tenant_role(public.get_user_tenant_id(), 'admin')
);

CREATE POLICY "Tenant admins can delete profile pictures"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'profile-pictures'
  AND (storage.foldername(name))[1] = 'profile-pictures'
  AND public.storage_tenant_id(name) = public.get_user_tenant_id()
  AND public.has_tenant_role(public.get_user_tenant_id(), 'admin')
);

COMMIT;
