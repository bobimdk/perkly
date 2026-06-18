
REVOKE EXECUTE ON FUNCTION public.award_points(UUID,INT,TEXT,JSONB) FROM public;
REVOKE EXECUTE ON FUNCTION public.open_mystery_box(UUID) FROM public;
REVOKE EXECUTE ON FUNCTION public.award_points_on_transaction() FROM public;
REVOKE EXECUTE ON FUNCTION public.level_for_xp(INT) FROM public;
GRANT EXECUTE ON FUNCTION public.level_for_xp(INT) TO authenticated, service_role;
