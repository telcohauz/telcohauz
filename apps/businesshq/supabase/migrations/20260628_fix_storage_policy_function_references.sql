-- Migration 20260627192923 moved is_company_member() and has_company_role() to private schema
-- But storage policies in migration 20260625175353 still reference them in public schema
-- This causes storage policies to fail when evaluating

-- Drop old storage policies that reference public.is_company_member (which no longer exists there)
DROP POLICY IF EXISTS "Members can view company files" ON storage.objects;
DROP POLICY IF EXISTS "Members can upload company files" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update company files" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete company files" ON storage.objects;

-- Recreate with private schema reference
CREATE POLICY "Members can view company files"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'businesshq-documents'
    AND private.is_company_member(((storage.foldername(name))[1])::uuid, auth.uid())
  );

CREATE POLICY "Members can upload company files"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'businesshq-documents'
    AND private.is_company_member(((storage.foldername(name))[1])::uuid, auth.uid())
  );

CREATE POLICY "Admins can update company files"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'businesshq-documents'
    AND private.has_company_role(((storage.foldername(name))[1])::uuid, auth.uid(), ARRAY['owner','admin']::company_role[])
  );

CREATE POLICY "Admins can delete company files"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'businesshq-documents'
    AND private.has_company_role(((storage.foldername(name))[1])::uuid, auth.uid(), ARRAY['owner','admin']::company_role[])
  );
