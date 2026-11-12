-- This migration fixes the RLS policy on companies table.
-- The previous migration (20260628010731) incorrectly relaxed the policy to only check auth.uid() IS NOT NULL.
-- This allows any authenticated user to insert, but RLS still validates the row data.
-- Since owner_id is never checked, the insert fails with "new row violates row-level security policy".

-- Drop the broken policy
DROP POLICY IF EXISTS "companies authenticated insert" ON public.companies;

-- Restore the correct policy that validates owner_id must match auth.uid()
CREATE POLICY "companies owner insert" ON public.companies FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = owner_id);

-- Update profile with active_company_id requires the profile to be owned by auth.uid()
-- This is already covered by the existing "profiles self update" policy which checks auth.uid() = id
