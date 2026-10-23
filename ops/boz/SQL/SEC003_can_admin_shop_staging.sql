-- STAGING REVIEW REQUIRED. Do not auto-apply to production.
-- Confirm the helper definition, auth.uid() predicate and existing ACL first.
BEGIN;
GRANT EXECUTE ON FUNCTION pos_private.can_admin_shop(uuid) TO authenticated;
-- Deliberately do not grant to anon or PUBLIC.
-- Regression: unaffiliated authenticated identity must receive FALSE.
SET LOCAL ROLE authenticated;
DO $$
BEGIN
  IF pos_private.can_admin_shop('00000000-0000-0000-0000-000000000001'::uuid) IS DISTINCT FROM FALSE THEN
    RAISE EXCEPTION 'Unexpected access for unaffiliated identity';
  END IF;
END $$;
RESET ROLE;
-- Additional authorized A/B shop identity tests are required before release.
ROLLBACK;
-- Proposed persistent migration, only after staging approval:
-- GRANT EXECUTE ON FUNCTION pos_private.can_admin_shop(uuid) TO authenticated;
-- Rollback matches observed pre-change ACL:
-- REVOKE EXECUTE ON FUNCTION pos_private.can_admin_shop(uuid) FROM authenticated;
