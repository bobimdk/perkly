
-- ============ User suspension ============
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS suspended boolean NOT NULL DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS suspended_reason text;

-- ============ Circles ============
CREATE TABLE IF NOT EXISTS public.circles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  icon text DEFAULT '🎯',
  cover_color text DEFAULT '#f59e0b',
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  is_public boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  member_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.circles TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.circles TO authenticated;
GRANT ALL ON public.circles TO service_role;
ALTER TABLE public.circles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "circles_public_read" ON public.circles FOR SELECT USING (is_public OR created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "circles_authed_create" ON public.circles FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());
CREATE POLICY "circles_owner_update" ON public.circles FOR UPDATE TO authenticated USING (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "circles_owner_delete" ON public.circles FOR DELETE TO authenticated USING (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE TABLE IF NOT EXISTS public.circle_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  circle_id uuid NOT NULL REFERENCES public.circles(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member',
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(circle_id, user_id)
);
GRANT SELECT, INSERT, DELETE ON public.circle_members TO authenticated;
GRANT ALL ON public.circle_members TO service_role;
ALTER TABLE public.circle_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "circle_members_read" ON public.circle_members FOR SELECT TO authenticated USING (true);
CREATE POLICY "circle_members_join" ON public.circle_members FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "circle_members_leave" ON public.circle_members FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.circle_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  circle_id uuid NOT NULL REFERENCES public.circles(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.circle_messages TO authenticated;
GRANT ALL ON public.circle_messages TO service_role;
ALTER TABLE public.circle_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "circle_messages_member_read" ON public.circle_messages FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.circle_members WHERE circle_id = circle_messages.circle_id AND user_id = auth.uid())
);
CREATE POLICY "circle_messages_member_post" ON public.circle_messages FOR INSERT TO authenticated WITH CHECK (
  user_id = auth.uid() AND EXISTS (SELECT 1 FROM public.circle_members WHERE circle_id = circle_messages.circle_id AND user_id = auth.uid())
);
CREATE POLICY "circle_messages_owner_delete" ON public.circle_messages FOR DELETE TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

ALTER PUBLICATION supabase_realtime ADD TABLE public.circle_messages;
ALTER TABLE public.circle_messages REPLICA IDENTITY FULL;

CREATE OR REPLACE FUNCTION public.bump_circle_member_count() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.circles SET member_count = member_count + 1 WHERE id = NEW.circle_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.circles SET member_count = GREATEST(member_count - 1, 0) WHERE id = OLD.circle_id;
  END IF;
  RETURN NULL;
END;$$;
DROP TRIGGER IF EXISTS trg_bump_circle_count ON public.circle_members;
CREATE TRIGGER trg_bump_circle_count AFTER INSERT OR DELETE ON public.circle_members FOR EACH ROW EXECUTE FUNCTION public.bump_circle_member_count();

-- ============ Gifts ============
CREATE TABLE IF NOT EXISTS public.gifts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  to_user uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount_all numeric(12,2) NOT NULL CHECK (amount_all > 0),
  message text,
  status text NOT NULL DEFAULT 'sent',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.gifts TO authenticated;
GRANT ALL ON public.gifts TO service_role;
ALTER TABLE public.gifts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "gifts_party_read" ON public.gifts FOR SELECT TO authenticated USING (from_user = auth.uid() OR to_user = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "gifts_sender_create" ON public.gifts FOR INSERT TO authenticated WITH CHECK (from_user = auth.uid());

CREATE OR REPLACE FUNCTION public.send_gift(p_to uuid, p_amount numeric, p_message text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_gift_id uuid; v_from uuid := auth.uid();
BEGIN
  IF v_from IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF v_from = p_to THEN RAISE EXCEPTION 'Cannot gift yourself'; END IF;
  UPDATE public.employee_budgets SET used_amount = used_amount + p_amount
    WHERE user_id = v_from AND period_start <= now() AND period_end >= now();
  UPDATE public.employee_budgets SET total_amount = total_amount + p_amount
    WHERE user_id = p_to AND period_start <= now() AND period_end >= now();
  INSERT INTO public.gifts (from_user, to_user, amount_all, message) VALUES (v_from, p_to, p_amount, p_message) RETURNING id INTO v_gift_id;
  INSERT INTO public.notifications (user_id, type, title, body, data)
    VALUES (p_to, 'gift_received', 'You received a gift! 🎁', COALESCE(p_message,'A colleague sent you perks'), jsonb_build_object('amount_all', p_amount, 'from', v_from));
  RETURN v_gift_id;
END;$$;
REVOKE ALL ON FUNCTION public.send_gift(uuid,numeric,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.send_gift(uuid,numeric,text) TO authenticated;

-- ============ Team Deals ============
CREATE TABLE IF NOT EXISTS public.team_deals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id uuid NOT NULL REFERENCES public.offers(id) ON DELETE CASCADE,
  title text NOT NULL,
  threshold integer NOT NULL DEFAULT 5,
  discount_percent integer NOT NULL DEFAULT 20,
  ends_at timestamptz NOT NULL DEFAULT (now() + interval '14 days'),
  joined_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.team_deals TO anon, authenticated;
GRANT ALL ON public.team_deals TO service_role;
ALTER TABLE public.team_deals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "team_deals_read" ON public.team_deals FOR SELECT USING (true);
CREATE POLICY "team_deals_admin_write" ON public.team_deals FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE IF NOT EXISTS public.team_deal_joiners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_deal_id uuid NOT NULL REFERENCES public.team_deals(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(team_deal_id, user_id)
);
GRANT SELECT, INSERT, DELETE ON public.team_deal_joiners TO authenticated;
GRANT ALL ON public.team_deal_joiners TO service_role;
ALTER TABLE public.team_deal_joiners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tdj_read" ON public.team_deal_joiners FOR SELECT TO authenticated USING (true);
CREATE POLICY "tdj_join" ON public.team_deal_joiners FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "tdj_leave" ON public.team_deal_joiners FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.bump_team_deal_count() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN UPDATE public.team_deals SET joined_count = joined_count + 1 WHERE id = NEW.team_deal_id;
  ELSIF TG_OP = 'DELETE' THEN UPDATE public.team_deals SET joined_count = GREATEST(joined_count-1,0) WHERE id = OLD.team_deal_id; END IF;
  RETURN NULL;
END;$$;
DROP TRIGGER IF EXISTS trg_bump_team_deal ON public.team_deal_joiners;
CREATE TRIGGER trg_bump_team_deal AFTER INSERT OR DELETE ON public.team_deal_joiners FOR EACH ROW EXECUTE FUNCTION public.bump_team_deal_count();

-- ============ Seasonal Drops ============
CREATE TABLE IF NOT EXISTS public.seasonal_drops (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  subtitle text,
  cover_image text,
  theme_color text DEFAULT '#f59e0b',
  starts_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz NOT NULL DEFAULT (now() + interval '30 days'),
  featured_offer_ids uuid[] NOT NULL DEFAULT ARRAY[]::uuid[],
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.seasonal_drops TO anon, authenticated;
GRANT ALL ON public.seasonal_drops TO service_role;
ALTER TABLE public.seasonal_drops ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sd_read" ON public.seasonal_drops FOR SELECT USING (is_active);
CREATE POLICY "sd_admin_write" ON public.seasonal_drops FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- ============ Perk Check-ins (heatmap) ============
CREATE TABLE IF NOT EXISTS public.perk_checkins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  lat double precision NOT NULL,
  lng double precision NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.perk_checkins TO anon, authenticated;
GRANT INSERT ON public.perk_checkins TO authenticated;
GRANT ALL ON public.perk_checkins TO service_role;
ALTER TABLE public.perk_checkins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "checkins_anon_read" ON public.perk_checkins FOR SELECT USING (true);
CREATE POLICY "checkins_self_insert" ON public.perk_checkins FOR INSERT TO authenticated WITH CHECK (user_id IS NULL OR user_id = auth.uid());
ALTER PUBLICATION supabase_realtime ADD TABLE public.perk_checkins;

-- ============ Admin Broadcasts ============
CREATE TABLE IF NOT EXISTS public.admin_broadcasts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body text NOT NULL,
  audience text NOT NULL DEFAULT 'all',
  sent_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  recipient_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.admin_broadcasts TO authenticated;
GRANT ALL ON public.admin_broadcasts TO service_role;
ALTER TABLE public.admin_broadcasts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "broadcasts_admin_all" ON public.admin_broadcasts FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE OR REPLACE FUNCTION public.send_broadcast(p_title text, p_body text, p_audience text)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_count integer; v_role app_role;
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Not authorized'; END IF;
  IF p_audience IN ('employee','employer','provider','admin') THEN
    v_role := p_audience::app_role;
    INSERT INTO public.notifications (user_id, type, title, body)
      SELECT ur.user_id, 'broadcast', p_title, p_body FROM public.user_roles ur WHERE ur.role = v_role;
  ELSE
    INSERT INTO public.notifications (user_id, type, title, body)
      SELECT id, 'broadcast', p_title, p_body FROM auth.users;
  END IF;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  INSERT INTO public.admin_broadcasts (title, body, audience, sent_by, recipient_count) VALUES (p_title, p_body, p_audience, auth.uid(), v_count);
  RETURN v_count;
END;$$;
REVOKE ALL ON FUNCTION public.send_broadcast(text,text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.send_broadcast(text,text,text) TO authenticated;

-- ============ FX rates ============
CREATE TABLE IF NOT EXISTS public.fx_rates (
  base text NOT NULL,
  quote text NOT NULL,
  rate numeric(14,6) NOT NULL,
  fetched_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (base, quote)
);
GRANT SELECT ON public.fx_rates TO anon, authenticated;
GRANT ALL ON public.fx_rates TO service_role;
ALTER TABLE public.fx_rates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fx_read" ON public.fx_rates FOR SELECT USING (true);
INSERT INTO public.fx_rates(base,quote,rate) VALUES ('ALL','EUR',0.0103),('EUR','ALL',97.2) ON CONFLICT (base,quote) DO NOTHING;

-- ============ Seed circles ============
INSERT INTO public.circles (name, slug, description, icon, cover_color, is_public) VALUES
  ('Runners of Tirana','runners-tirana','Weekly runs, race tips, and gear deals','🏃','#ef4444', true),
  ('Gym Lovers','gym-lovers','Form check, splits, and gym perks','💪','#0ea5e9', true),
  ('Travelers','travelers','Weekend trips and travel hacks','✈️','#8b5cf6', true),
  ('Foodies','foodies','Best lunch spots near the office','🍽️','#f97316', true),
  ('Mindful Minds','mindful-minds','Meditation, therapy, and balance','🧘','#10b981', true)
ON CONFLICT (slug) DO NOTHING;

-- ============ Seed seasonal drops ============
INSERT INTO public.seasonal_drops (slug, title, subtitle, cover_image, theme_color, ends_at)
VALUES
  ('summer-energy-2026','Summer Energy 2026','Hydration, fitness, and weekend escapes','https://images.unsplash.com/photo-1530549387789-4c1017266635?w=1600','#f59e0b', now() + interval '45 days'),
  ('mindful-month','Mindful Month','30 days of therapy, meditation, and reading perks','https://images.unsplash.com/photo-1545389336-cf090694435e?w=1600','#10b981', now() + interval '30 days')
ON CONFLICT (slug) DO NOTHING;

-- ============ Seed team deals ============
INSERT INTO public.team_deals (offer_id, title, threshold, discount_percent, ends_at)
SELECT o.id, 'Squad Unlock: ' || o.title, 5, 25, now() + interval '14 days'
FROM public.offers o WHERE o.status = 'published' ORDER BY random() LIMIT 4;

-- ============ Seed perk check-ins (Tirana area) ============
INSERT INTO public.perk_checkins (provider_id, lat, lng)
SELECT p.id,
  41.3275 + (random() - 0.5) * 0.05,
  19.8189 + (random() - 0.5) * 0.05
FROM public.providers p, generate_series(1, 3);
