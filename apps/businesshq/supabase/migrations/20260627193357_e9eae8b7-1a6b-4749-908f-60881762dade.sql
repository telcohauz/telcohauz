CREATE POLICY "Users can create their own company"
ON public.companies
FOR INSERT
TO authenticated
WITH CHECK (owner_id = auth.uid());