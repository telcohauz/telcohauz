
CREATE TABLE public.company_insert_failures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  session_user_available boolean NOT NULL,
  attempted_payload jsonb NOT NULL,
  error_code text,
  error_message text,
  error_details text,
  error_hint text,
  user_agent text,
  route text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.company_insert_failures TO authenticated;
GRANT ALL ON public.company_insert_failures TO service_role;

ALTER TABLE public.company_insert_failures ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can insert a log row (used during onboarding failure)
-- but must attribute it to themselves (or null if no session).
CREATE POLICY "Authenticated can insert own failure log"
  ON public.company_insert_failures
  FOR INSERT TO authenticated
  WITH CHECK (user_id IS NULL OR user_id = auth.uid());

-- Only owner/admin (in any company) can read logs.
CREATE POLICY "Admins can read failure logs"
  ON public.company_insert_failures
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.company_members cm
      WHERE cm.user_id = auth.uid()
        AND cm.role IN ('owner','admin')
    )
  );

CREATE INDEX company_insert_failures_created_at_idx
  ON public.company_insert_failures (created_at DESC);
