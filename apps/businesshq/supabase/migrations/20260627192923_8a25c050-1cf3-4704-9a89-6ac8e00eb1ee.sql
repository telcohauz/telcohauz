
-- 1. Tighten UPDATE policies on documents, licenses, compliance_items
DROP POLICY IF EXISTS "docs member update" ON public.documents;
CREATE POLICY "docs manager update" ON public.documents FOR UPDATE TO authenticated
  USING (public.has_company_role(company_id, auth.uid(), ARRAY['owner','admin','manager']::company_role[]))
  WITH CHECK (public.has_company_role(company_id, auth.uid(), ARRAY['owner','admin','manager']::company_role[]));

DROP POLICY IF EXISTS "lic member update" ON public.licenses;
CREATE POLICY "lic manager update" ON public.licenses FOR UPDATE TO authenticated
  USING (public.has_company_role(company_id, auth.uid(), ARRAY['owner','admin','manager']::company_role[]))
  WITH CHECK (public.has_company_role(company_id, auth.uid(), ARRAY['owner','admin','manager']::company_role[]));

DROP POLICY IF EXISTS "comp member update" ON public.compliance_items;
CREATE POLICY "comp manager update" ON public.compliance_items FOR UPDATE TO authenticated
  USING (public.has_company_role(company_id, auth.uid(), ARRAY['owner','admin','manager']::company_role[]))
  WITH CHECK (public.has_company_role(company_id, auth.uid(), ARRAY['owner','admin','manager']::company_role[]));

-- 2. Restrict staff SELECT (salary PII) to manager-and-above
DROP POLICY IF EXISTS "Members can view staff" ON public.staff;
CREATE POLICY "Managers can view staff" ON public.staff FOR SELECT TO authenticated
  USING (public.has_company_role(company_id, auth.uid(), ARRAY['owner','admin','manager']::company_role[]));

-- 3. Move SECURITY DEFINER helpers to a private schema (not exposed by PostgREST)
CREATE SCHEMA IF NOT EXISTS private;
GRANT USAGE ON SCHEMA private TO authenticated, service_role;

ALTER FUNCTION public.is_company_member(uuid, uuid) SET SCHEMA private;
ALTER FUNCTION public.has_company_role(uuid, uuid, company_role[]) SET SCHEMA private;

-- Re-grant execute (defaults preserved) explicitly for clarity
GRANT EXECUTE ON FUNCTION private.is_company_member(uuid, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.has_company_role(uuid, uuid, company_role[]) TO authenticated, service_role;
