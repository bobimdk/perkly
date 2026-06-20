GRANT SELECT ON public.circles TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.circles TO authenticated;
GRANT ALL ON public.circles TO service_role;

GRANT SELECT ON public.circle_members TO anon, authenticated;
GRANT INSERT, DELETE ON public.circle_members TO authenticated;
GRANT ALL ON public.circle_members TO service_role;

GRANT SELECT ON public.circle_messages TO anon, authenticated;
GRANT INSERT ON public.circle_messages TO authenticated;
GRANT ALL ON public.circle_messages TO service_role;