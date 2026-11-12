CREATE POLICY "Members can view company files"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'businesshq-documents'
    AND public.is_company_member(((storage.foldername(name))[1])::uuid, auth.uid())
  );

CREATE POLICY "Members can upload company files"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'businesshq-documents'
    AND public.is_company_member(((storage.foldername(name))[1])::uuid, auth.uid())
  );

CREATE POLICY "Admins can update company files"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'businesshq-documents'
    AND public.has_company_role(((storage.foldername(name))[1])::uuid, auth.uid(), ARRAY['owner','admin']::company_role[])
  );

CREATE POLICY "Admins can delete company files"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'businesshq-documents'
    AND public.has_company_role(((storage.foldername(name))[1])::uuid, auth.uid(), ARRAY['owner','admin']::company_role[])
  );