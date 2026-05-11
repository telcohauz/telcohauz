
REVOKE ALL ON FUNCTION public.approve_topup(uuid, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.reject_topup(uuid, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.refund_order(uuid, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.place_order(uuid, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.approve_topup(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reject_topup(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.refund_order(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.place_order(uuid, text, text) TO authenticated;
