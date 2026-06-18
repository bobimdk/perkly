
-- ===== USER STATS =====
CREATE TABLE public.user_stats (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  level INT NOT NULL DEFAULT 1,
  xp INT NOT NULL DEFAULT 0,
  total_points INT NOT NULL DEFAULT 0,
  available_points INT NOT NULL DEFAULT 0,
  current_streak INT NOT NULL DEFAULT 0,
  longest_streak INT NOT NULL DEFAULT 0,
  last_activity_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.user_stats TO authenticated;
GRANT ALL ON public.user_stats TO service_role;
ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own stats read" ON public.user_stats FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own stats insert" ON public.user_stats FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own stats update" ON public.user_stats FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE TRIGGER user_stats_updated_at BEFORE UPDATE ON public.user_stats FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ===== POINTS LEDGER =====
CREATE TABLE public.points_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  delta INT NOT NULL,
  reason TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.points_ledger TO authenticated;
GRANT ALL ON public.points_ledger TO service_role;
ALTER TABLE public.points_ledger ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own ledger read" ON public.points_ledger FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE INDEX idx_points_ledger_user ON public.points_ledger(user_id, created_at DESC);

-- ===== BADGES =====
CREATE TABLE public.badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  tier TEXT NOT NULL DEFAULT 'bronze',
  requirement TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.badges TO anon, authenticated;
GRANT ALL ON public.badges TO service_role;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "badges public read" ON public.badges FOR SELECT USING (true);
CREATE POLICY "badges admin write" ON public.badges FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, badge_id)
);
GRANT SELECT ON public.user_badges TO authenticated;
GRANT ALL ON public.user_badges TO service_role;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own user_badges read" ON public.user_badges FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- ===== QUESTS =====
CREATE TABLE public.quests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'daily',
  target INT NOT NULL DEFAULT 1,
  reward_points INT NOT NULL DEFAULT 25,
  icon TEXT NOT NULL DEFAULT '🎯',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.quests TO anon, authenticated;
GRANT ALL ON public.quests TO service_role;
ALTER TABLE public.quests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "quests public read" ON public.quests FOR SELECT USING (true);
CREATE POLICY "quests admin write" ON public.quests FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.quest_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quest_id UUID NOT NULL REFERENCES public.quests(id) ON DELETE CASCADE,
  progress INT NOT NULL DEFAULT 0,
  completed_at TIMESTAMPTZ,
  claimed_at TIMESTAMPTZ,
  period_key TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, quest_id, period_key)
);
GRANT SELECT, INSERT, UPDATE ON public.quest_progress TO authenticated;
GRANT ALL ON public.quest_progress TO service_role;
ALTER TABLE public.quest_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own quest_progress read" ON public.quest_progress FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own quest_progress insert" ON public.quest_progress FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own quest_progress update" ON public.quest_progress FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- ===== MYSTERY BOXES =====
CREATE TABLE public.mystery_boxes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  cost_points INT NOT NULL,
  tier TEXT NOT NULL DEFAULT 'bronze',
  icon TEXT NOT NULL DEFAULT '🎁',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.mystery_boxes TO anon, authenticated;
GRANT ALL ON public.mystery_boxes TO service_role;
ALTER TABLE public.mystery_boxes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "boxes public read" ON public.mystery_boxes FOR SELECT USING (true);
CREATE POLICY "boxes admin write" ON public.mystery_boxes FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.box_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  box_id UUID NOT NULL REFERENCES public.mystery_boxes(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  description TEXT,
  points_value INT NOT NULL DEFAULT 0,
  weight INT NOT NULL DEFAULT 10,
  rarity TEXT NOT NULL DEFAULT 'common',
  icon TEXT NOT NULL DEFAULT '✨',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.box_rewards TO anon, authenticated;
GRANT ALL ON public.box_rewards TO service_role;
ALTER TABLE public.box_rewards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "box_rewards public read" ON public.box_rewards FOR SELECT USING (true);
CREATE POLICY "box_rewards admin write" ON public.box_rewards FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.box_openings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  box_id UUID NOT NULL REFERENCES public.mystery_boxes(id) ON DELETE CASCADE,
  reward_id UUID REFERENCES public.box_rewards(id) ON DELETE SET NULL,
  reward_label TEXT NOT NULL,
  points_awarded INT NOT NULL DEFAULT 0,
  rarity TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.box_openings TO authenticated;
GRANT ALL ON public.box_openings TO service_role;
ALTER TABLE public.box_openings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own box_openings read" ON public.box_openings FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- ===== HELPERS =====
CREATE OR REPLACE FUNCTION public.level_for_xp(_xp INT)
RETURNS INT LANGUAGE sql IMMUTABLE AS $$
  SELECT GREATEST(1, FLOOR(SQRT(_xp::numeric / 100.0))::INT + 1);
$$;

CREATE OR REPLACE FUNCTION public.award_points(_user_id UUID, _delta INT, _reason TEXT, _metadata JSONB DEFAULT NULL)
RETURNS public.user_stats
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE s public.user_stats; new_level INT; today DATE := CURRENT_DATE;
BEGIN
  INSERT INTO public.user_stats (user_id) VALUES (_user_id)
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.points_ledger (user_id, delta, reason, metadata)
  VALUES (_user_id, _delta, _reason, _metadata);

  UPDATE public.user_stats
  SET total_points = total_points + GREATEST(_delta, 0),
      available_points = GREATEST(0, available_points + _delta),
      xp = xp + GREATEST(_delta, 0),
      current_streak = CASE
        WHEN last_activity_date = today THEN current_streak
        WHEN last_activity_date = today - 1 THEN current_streak + 1
        ELSE 1
      END,
      longest_streak = GREATEST(longest_streak,
        CASE
          WHEN last_activity_date = today THEN current_streak
          WHEN last_activity_date = today - 1 THEN current_streak + 1
          ELSE 1
        END),
      last_activity_date = today
  WHERE user_id = _user_id
  RETURNING * INTO s;

  new_level := public.level_for_xp(s.xp);
  IF new_level <> s.level THEN
    UPDATE public.user_stats SET level = new_level WHERE user_id = _user_id RETURNING * INTO s;
  END IF;

  RETURN s;
END $$;
GRANT EXECUTE ON FUNCTION public.award_points(UUID,INT,TEXT,JSONB) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.open_mystery_box(_box_id UUID)
RETURNS public.box_openings
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  box public.mystery_boxes;
  rewards_total INT;
  pick INT;
  cumulative INT := 0;
  chosen public.box_rewards;
  s public.user_stats;
  result public.box_openings;
  uid UUID := auth.uid();
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'unauthorized'; END IF;
  SELECT * INTO box FROM public.mystery_boxes WHERE id=_box_id AND is_active=true;
  IF box.id IS NULL THEN RAISE EXCEPTION 'box_not_found'; END IF;

  INSERT INTO public.user_stats (user_id) VALUES (uid) ON CONFLICT DO NOTHING;
  SELECT * INTO s FROM public.user_stats WHERE user_id=uid FOR UPDATE;
  IF s.available_points < box.cost_points THEN RAISE EXCEPTION 'insufficient_points'; END IF;

  SELECT COALESCE(SUM(weight),0) INTO rewards_total FROM public.box_rewards WHERE box_id=_box_id;
  IF rewards_total <= 0 THEN RAISE EXCEPTION 'no_rewards'; END IF;
  pick := floor(random() * rewards_total)::INT + 1;

  FOR chosen IN SELECT * FROM public.box_rewards WHERE box_id=_box_id ORDER BY weight DESC, id LOOP
    cumulative := cumulative + chosen.weight;
    IF pick <= cumulative THEN EXIT; END IF;
  END LOOP;

  UPDATE public.user_stats
  SET available_points = available_points - box.cost_points
  WHERE user_id = uid;
  INSERT INTO public.points_ledger(user_id, delta, reason, metadata)
  VALUES (uid, -box.cost_points, 'mystery_box', jsonb_build_object('box_id', _box_id));

  IF chosen.points_value > 0 THEN
    PERFORM public.award_points(uid, chosen.points_value, 'mystery_box_reward',
      jsonb_build_object('box_id', _box_id, 'reward_id', chosen.id));
  END IF;

  INSERT INTO public.box_openings(user_id, box_id, reward_id, reward_label, points_awarded, rarity)
  VALUES (uid, _box_id, chosen.id, chosen.label, chosen.points_value, chosen.rarity)
  RETURNING * INTO result;
  RETURN result;
END $$;
GRANT EXECUTE ON FUNCTION public.open_mystery_box(UUID) TO authenticated;

-- ===== AWARD POINTS ON TRANSACTION =====
CREATE OR REPLACE FUNCTION public.award_points_on_transaction()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status = 'succeeded' THEN
    PERFORM public.award_points(NEW.user_id, 50, 'benefit_purchase',
      jsonb_build_object('transaction_id', NEW.id, 'provider_id', NEW.provider_id));
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_award_points_tx AFTER INSERT ON public.transactions
FOR EACH ROW EXECUTE FUNCTION public.award_points_on_transaction();

-- ===== SEEDS =====
INSERT INTO public.badges (key, name, description, icon, tier, requirement) VALUES
('first_perk','First Perk','Redeemed your first benefit','🌟','bronze','Make 1 purchase'),
('explorer','Explorer','Tried 5 different categories','🧭','silver','Try 5 categories'),
('wellness_guru','Wellness Guru','10 wellness benefits used','🧘','gold','10 wellness perks'),
('streak_7','Week Warrior','7-day streak','🔥','silver','7-day streak'),
('streak_30','Legend','30-day streak','🏆','gold','30-day streak'),
('big_spender','Big Spender','Used 100,000 ALL of benefits','💎','platinum','100k ALL spent')
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.quests (key, title, description, kind, target, reward_points, icon) VALUES
('daily_browse','Browse the Marketplace','Visit the marketplace once today','daily',1,10,'🛍️'),
('daily_add_item','Add a Perk to Your Basket','Add at least 1 item to your package','daily',1,20,'➕'),
('daily_concierge','Ask the AI Concierge','Use the AI Concierge once','daily',1,25,'🤖'),
('weekly_submit','Submit a Package','Submit 1 benefits request this week','weekly',1,75,'📦'),
('weekly_review','Leave a Review','Review a benefit you tried','weekly',1,50,'💬')
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.mystery_boxes (key, name, description, cost_points, tier, icon) VALUES
('bronze_box','Bronze Surprise Box','A daily-friendly box with small rewards','100','bronze','📦'),
('silver_box','Silver Treasure Box','Mid-tier box with better odds','300','silver','🎁'),
('gold_box','Gold Vault Box','Premium box, rare rewards','750','gold','🏆')
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.box_rewards (box_id, label, description, points_value, weight, rarity, icon)
SELECT b.id, r.label, r.description, r.points_value, r.weight, r.rarity, r.icon
FROM public.mystery_boxes b
JOIN (VALUES
  ('bronze_box','+25 Perk Points',NULL,25,50,'common','✨'),
  ('bronze_box','+50 Perk Points',NULL,50,30,'uncommon','💫'),
  ('bronze_box','+100 Perk Points',NULL,100,15,'rare','⭐'),
  ('bronze_box','Free Coffee Voucher','One coffee at any partner cafe',0,5,'epic','☕'),
  ('silver_box','+100 Perk Points',NULL,100,45,'common','✨'),
  ('silver_box','+250 Perk Points',NULL,250,30,'uncommon','💫'),
  ('silver_box','+500 Perk Points',NULL,500,15,'rare','⭐'),
  ('silver_box','Spa Day Voucher','Free spa session at Prime Wellness',0,10,'epic','🧖'),
  ('gold_box','+300 Perk Points',NULL,300,40,'common','✨'),
  ('gold_box','+750 Perk Points',NULL,750,30,'uncommon','💫'),
  ('gold_box','+1500 Perk Points',NULL,1500,20,'rare','⭐'),
  ('gold_box','Weekend Getaway','A 2-night Albania escape',0,10,'legendary','✈️')
) AS r(box_key,label,description,points_value,weight,rarity,icon) ON r.box_key = b.key
ON CONFLICT DO NOTHING;
