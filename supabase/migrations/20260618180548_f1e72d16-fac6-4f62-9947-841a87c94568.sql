
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM public, anon;
REVOKE EXECUTE ON FUNCTION public.recalc_package_total() FROM public, anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM public, anon;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;
