
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS username text UNIQUE,
  ADD COLUMN IF NOT EXISTS headline text,
  ADD COLUMN IF NOT EXISTS bio text,
  ADD COLUMN IF NOT EXISTS cover_url text,
  ADD COLUMN IF NOT EXISTS location text,
  ADD COLUMN IF NOT EXISTS company_name text,
  ADD COLUMN IF NOT EXISTS role_title text;

WITH base AS (
  SELECT id, regexp_replace(lower(split_part(coalesce(email,'user'),'@',1)), '[^a-z0-9_]+', '', 'g') AS slug
  FROM public.profiles WHERE username IS NULL
),
numbered AS (
  SELECT id,
    CASE WHEN slug='' THEN 'user' ELSE slug END
      || CASE WHEN row_number() OVER (PARTITION BY CASE WHEN slug='' THEN 'user' ELSE slug END ORDER BY id) = 1
              THEN '' ELSE row_number() OVER (PARTITION BY CASE WHEN slug='' THEN 'user' ELSE slug END ORDER BY id)::text END
      AS uname
  FROM base
)
UPDATE public.profiles p SET username = n.uname FROM numbered n
WHERE p.id = n.id AND p.username IS NULL
  AND NOT EXISTS (SELECT 1 FROM public.profiles p2 WHERE p2.username = n.uname);

DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON public.profiles;
CREATE POLICY "Profiles are viewable by authenticated users"
  ON public.profiles FOR SELECT TO authenticated USING (true);

ALTER TABLE public.providers
  ADD COLUMN IF NOT EXISTS is_sponsored boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS sponsored_until timestamptz;

DO $$ BEGIN
  CREATE TYPE public.friendship_status AS ENUM ('pending','accepted','declined');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.friendships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  addressee_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status public.friendship_status NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT friendships_no_self CHECK (requester_id <> addressee_id),
  CONSTRAINT friendships_unique_pair UNIQUE (requester_id, addressee_id)
);
CREATE INDEX IF NOT EXISTS friendships_requester_idx ON public.friendships(requester_id);
CREATE INDEX IF NOT EXISTS friendships_addressee_idx ON public.friendships(addressee_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.friendships TO authenticated;
GRANT ALL ON public.friendships TO service_role;
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Friends can view their friendships" ON public.friendships;
CREATE POLICY "Friends can view their friendships" ON public.friendships FOR SELECT TO authenticated
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id);
DROP POLICY IF EXISTS "Users can send friend requests" ON public.friendships;
CREATE POLICY "Users can send friend requests" ON public.friendships FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = requester_id);
DROP POLICY IF EXISTS "Either party can update friendship" ON public.friendships;
CREATE POLICY "Either party can update friendship" ON public.friendships FOR UPDATE TO authenticated
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id)
  WITH CHECK (auth.uid() = requester_id OR auth.uid() = addressee_id);
DROP POLICY IF EXISTS "Either party can delete friendship" ON public.friendships;
CREATE POLICY "Either party can delete friendship" ON public.friendships FOR DELETE TO authenticated
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

DROP TRIGGER IF EXISTS friendships_set_updated_at ON public.friendships;
CREATE TRIGGER friendships_set_updated_at BEFORE UPDATE ON public.friendships
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.notify_on_friend_request()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_name text;
BEGIN
  IF NEW.status = 'pending' THEN
    SELECT COALESCE(NULLIF(trim(concat_ws(' ', first_name, last_name)),''), email, 'Dikush')
      INTO v_name FROM public.profiles WHERE id = NEW.requester_id;
    INSERT INTO public.notifications (user_id, kind, title, body, href)
    VALUES (NEW.addressee_id, 'friend_request', 'Kërkesë e re shoqërie',
            v_name || ' dëshiron t''ju shtojë në rrjet.', '/network');
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS friendships_notify_request ON public.friendships;
CREATE TRIGGER friendships_notify_request AFTER INSERT ON public.friendships
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_friend_request();

CREATE OR REPLACE FUNCTION public.are_friends(_a uuid, _b uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.friendships WHERE status='accepted'
      AND ((requester_id=_a AND addressee_id=_b) OR (requester_id=_b AND addressee_id=_a))
  )
$$;

CREATE OR REPLACE FUNCTION public.send_gift(p_to uuid, p_amount numeric, p_message text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_gift_id uuid; v_from uuid := auth.uid();
BEGIN
  IF v_from IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF v_from = p_to THEN RAISE EXCEPTION 'Cannot gift yourself'; END IF;
  IF p_amount <= 0 THEN RAISE EXCEPTION 'Amount must be positive'; END IF;
  IF NOT public.are_friends(v_from, p_to) THEN RAISE EXCEPTION 'Recipient must be a friend'; END IF;

  UPDATE public.employee_budgets SET used_all = used_all + p_amount
    WHERE user_id = v_from AND now()::date BETWEEN period_start AND period_end;
  UPDATE public.employee_budgets SET total_all = total_all + p_amount
    WHERE user_id = p_to AND now()::date BETWEEN period_start AND period_end;

  INSERT INTO public.gifts (from_user, to_user, amount_all, message)
    VALUES (v_from, p_to, p_amount, p_message) RETURNING id INTO v_gift_id;

  INSERT INTO public.notifications (user_id, kind, title, body, href)
    VALUES (p_to, 'gift_received', 'Keni marrë një dhuratë! 🎁',
            COALESCE(p_message, 'Një shok ju dërgoi përfitime.'), '/employee');
  RETURN v_gift_id;
END $$;
