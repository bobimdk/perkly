DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Employers can view profiles of their employees" ON public.profiles;

CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Employers can view profiles of their employees"
  ON public.profiles FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.company_employees ce
      JOIN public.companies c ON c.id = ce.company_id
      WHERE ce.user_id = profiles.id
        AND c.owner_id = auth.uid()
    )
  );

CREATE OR REPLACE FUNCTION public.get_public_profile_by_id(_id uuid)
RETURNS TABLE (
  id uuid, username text, first_name text, last_name text,
  avatar_url text, headline text, bio text, cover_url text,
  location text, company_name text, role_title text, created_at timestamptz
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id, username, first_name, last_name, avatar_url, headline,
         bio, cover_url, location, company_name, role_title, created_at
  FROM public.profiles WHERE id = _id
$$;

CREATE OR REPLACE FUNCTION public.get_public_profile_by_username(_username text)
RETURNS TABLE (
  id uuid, username text, first_name text, last_name text,
  avatar_url text, headline text, bio text, cover_url text,
  location text, company_name text, role_title text, created_at timestamptz
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id, username, first_name, last_name, avatar_url, headline,
         bio, cover_url, location, company_name, role_title, created_at
  FROM public.profiles WHERE username = _username
$$;

CREATE OR REPLACE FUNCTION public.get_public_profiles(_ids uuid[])
RETURNS TABLE (
  id uuid, username text, first_name text, last_name text,
  avatar_url text, headline text, bio text, cover_url text,
  location text, company_name text, role_title text, created_at timestamptz
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id, username, first_name, last_name, avatar_url, headline,
         bio, cover_url, location, company_name, role_title, created_at
  FROM public.profiles WHERE id = ANY(_ids)
$$;

CREATE OR REPLACE FUNCTION public.search_public_profiles(_query text)
RETURNS TABLE (
  id uuid, username text, first_name text, last_name text,
  avatar_url text, headline text, bio text, cover_url text,
  location text, company_name text, role_title text, created_at timestamptz
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id, username, first_name, last_name, avatar_url, headline,
         bio, cover_url, location, company_name, role_title, created_at
  FROM public.profiles
  WHERE _query IS NULL OR _query = '' OR (
    first_name ILIKE '%'||_query||'%' OR
    last_name  ILIKE '%'||_query||'%' OR
    username   ILIKE '%'||_query||'%' OR
    company_name ILIKE '%'||_query||'%' OR
    role_title ILIKE '%'||_query||'%'
  )
  ORDER BY created_at DESC
  LIMIT 30
$$;

CREATE OR REPLACE FUNCTION public.find_user_id_by_email(_email text)
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id FROM public.profiles
  WHERE lower(email) = lower(_email) LIMIT 1
$$;

REVOKE EXECUTE ON FUNCTION public.find_user_id_by_email(text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.find_user_id_by_email(text) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.get_public_profile_by_id(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_public_profile_by_username(text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_public_profiles(uuid[]) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.search_public_profiles(text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.get_public_profile_by_id(uuid) TO authenticated;
GRANT  EXECUTE ON FUNCTION public.get_public_profile_by_username(text) TO authenticated;
GRANT  EXECUTE ON FUNCTION public.get_public_profiles(uuid[]) TO authenticated;
GRANT  EXECUTE ON FUNCTION public.search_public_profiles(text) TO authenticated;

REVOKE SELECT ON public.providers FROM anon, authenticated;
GRANT  SELECT (
  id, owner_id, slug, name, tagline, description, logo_url, cover_url,
  website, city, address, lat, lng, status, rating_avg, rating_count,
  is_sponsored, sponsored_until, created_at, updated_at
) ON public.providers TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_provider_contact(_provider_id uuid)
RETURNS TABLE (email text, phone text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT email, phone FROM public.providers
  WHERE id = _provider_id
    AND (owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
$$;
REVOKE EXECUTE ON FUNCTION public.get_provider_contact(uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.get_provider_contact(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.is_circle_member(_circle_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.circle_members
    WHERE circle_id = _circle_id AND user_id = _user_id
  )
$$;
REVOKE EXECUTE ON FUNCTION public.is_circle_member(uuid, uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.is_circle_member(uuid, uuid) TO authenticated;

DROP POLICY IF EXISTS "circle_members_read" ON public.circle_members;
CREATE POLICY "circle_members_read" ON public.circle_members
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR public.is_circle_member(circle_id, auth.uid())
  );

DROP POLICY IF EXISTS "checkins_anon_read" ON public.perk_checkins;
DROP POLICY IF EXISTS "checkins_authenticated_read" ON public.perk_checkins;
CREATE POLICY "checkins_authenticated_read"
  ON public.perk_checkins FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "tdj_read" ON public.team_deal_joiners;
DROP POLICY IF EXISTS "tdj_read_own" ON public.team_deal_joiners;
CREATE POLICY "tdj_read_own"
  ON public.team_deal_joiners FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.level_for_xp(_xp INT)
RETURNS INT LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT GREATEST(1, FLOOR(SQRT(_xp::numeric / 100.0))::INT + 1);
$$;

REVOKE EXECUTE ON FUNCTION public.update_updated_at_column()    FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user()             FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.recalc_package_total()        FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.award_points_on_transaction() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.bump_circle_member_count()    FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.bump_team_deal_count()        FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_on_invite()            FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_on_friend_request()    FROM PUBLIC, anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role)      FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_company_owner(uuid, uuid)          FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.are_friends(uuid, uuid)               FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.send_gift(uuid, numeric, text)        FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.approve_benefit_request(uuid)         FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.reject_benefit_request(uuid, text)    FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.submit_benefit_request(uuid, text)    FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.accept_company_invite(uuid)           FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.reject_company_invite(uuid)           FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.redeem_transaction(text)              FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.award_points(uuid, int, text, jsonb)  FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.open_mystery_box(uuid)                FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.send_broadcast(text, text, text)      FROM PUBLIC, anon;