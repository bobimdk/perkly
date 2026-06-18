
DROP POLICY IF EXISTS "Authenticated insert notif" ON public.notifications;
CREATE POLICY "Self insert own notif" ON public.notifications FOR INSERT TO authenticated WITH CHECK (user_id=auth.uid());
