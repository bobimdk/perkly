
-- 1. company_invites table
CREATE TABLE public.company_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  employer_id uuid NOT NULL,
  email text NOT NULL,
  employee_id uuid,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','rejected','cancelled')),
  message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  decided_at timestamptz,
  UNIQUE (company_id, email)
);

CREATE INDEX company_invites_email_idx ON public.company_invites (lower(email));
CREATE INDEX company_invites_company_idx ON public.company_invites (company_id);
CREATE INDEX company_invites_employee_idx ON public.company_invites (employee_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.company_invites TO authenticated;
GRANT ALL ON public.company_invites TO service_role;

ALTER TABLE public.company_invites ENABLE ROW LEVEL SECURITY;

-- Employer (owner of company) can manage their invites
CREATE POLICY "Employer manages own invites"
ON public.company_invites
FOR ALL
TO authenticated
USING (
  public.is_company_owner(auth.uid(), company_id)
  OR public.has_role(auth.uid(), 'admin')
)
WITH CHECK (
  public.is_company_owner(auth.uid(), company_id)
  OR public.has_role(auth.uid(), 'admin')
);

-- Invitee can see + update their own invites (matched by email or employee_id)
CREATE POLICY "Invitee sees own invites"
ON public.company_invites
FOR SELECT
TO authenticated
USING (
  employee_id = auth.uid()
  OR lower(email) = lower(COALESCE((auth.jwt() ->> 'email'), ''))
);

CREATE POLICY "Invitee updates own invites"
ON public.company_invites
FOR UPDATE
TO authenticated
USING (
  employee_id = auth.uid()
  OR lower(email) = lower(COALESCE((auth.jwt() ->> 'email'), ''))
)
WITH CHECK (
  employee_id = auth.uid()
  OR lower(email) = lower(COALESCE((auth.jwt() ->> 'email'), ''))
);

-- 2. Notify trigger on invite insert -> notification + link to existing profile if any
CREATE OR REPLACE FUNCTION public.notify_on_invite()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_profile_id uuid; v_company_name text;
BEGIN
  SELECT id INTO v_profile_id FROM public.profiles WHERE lower(email) = lower(NEW.email) LIMIT 1;
  SELECT name INTO v_company_name FROM public.companies WHERE id = NEW.company_id;
  IF v_profile_id IS NOT NULL THEN
    NEW.employee_id := COALESCE(NEW.employee_id, v_profile_id);
    INSERT INTO public.notifications (user_id, kind, title, body, href)
    VALUES (v_profile_id, 'company_invite',
            'Ftesë e re nga ' || COALESCE(v_company_name,'biznesi'),
            'Ju jeni ftuar të bashkoheni me ekipin. Pranoni ose refuzoni nga paneli juaj.',
            '/employee');
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS notify_on_invite ON public.company_invites;
CREATE TRIGGER notify_on_invite
BEFORE INSERT ON public.company_invites
FOR EACH ROW EXECUTE FUNCTION public.notify_on_invite();

-- 3. Accept / reject RPCs
CREATE OR REPLACE FUNCTION public.accept_company_invite(_invite_id uuid)
RETURNS public.company_invites
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE inv public.company_invites; v_uid uuid := auth.uid(); v_email text; v_company_name text;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'unauthorized'; END IF;
  SELECT email INTO v_email FROM public.profiles WHERE id = v_uid;
  SELECT * INTO inv FROM public.company_invites WHERE id = _invite_id FOR UPDATE;
  IF inv.id IS NULL THEN RAISE EXCEPTION 'invite_not_found'; END IF;
  IF inv.status <> 'pending' THEN RAISE EXCEPTION 'invite_not_pending'; END IF;
  IF NOT (inv.employee_id = v_uid OR lower(inv.email) = lower(COALESCE(v_email,''))) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  UPDATE public.company_invites
  SET status = 'accepted', decided_at = now(), employee_id = v_uid
  WHERE id = _invite_id;

  INSERT INTO public.company_employees (company_id, user_id, invite_email, full_name, status, monthly_budget_all)
  VALUES (
    inv.company_id, v_uid, inv.email,
    (SELECT COALESCE(NULLIF(trim(concat_ws(' ', first_name, last_name)),''), email) FROM public.profiles WHERE id=v_uid),
    'active',
    (SELECT monthly_default_budget_all FROM public.companies WHERE id=inv.company_id)
  )
  ON CONFLICT DO NOTHING;

  SELECT name INTO v_company_name FROM public.companies WHERE id=inv.company_id;
  INSERT INTO public.notifications (user_id, kind, title, body, href)
  SELECT c.owner_id, 'invite_accepted',
         'Punonjësi pranoi ftesën',
         COALESCE((SELECT first_name||' '||last_name FROM public.profiles WHERE id=v_uid), inv.email)
         || ' u bashkua me ' || COALESCE(v_company_name,'biznesin tuaj') || '.',
         '/employer'
  FROM public.companies c WHERE c.id = inv.company_id;

  SELECT * INTO inv FROM public.company_invites WHERE id=_invite_id;
  RETURN inv;
END $$;

CREATE OR REPLACE FUNCTION public.reject_company_invite(_invite_id uuid)
RETURNS public.company_invites
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE inv public.company_invites; v_uid uuid := auth.uid(); v_email text;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'unauthorized'; END IF;
  SELECT email INTO v_email FROM public.profiles WHERE id = v_uid;
  SELECT * INTO inv FROM public.company_invites WHERE id = _invite_id FOR UPDATE;
  IF inv.id IS NULL THEN RAISE EXCEPTION 'invite_not_found'; END IF;
  IF inv.status <> 'pending' THEN RAISE EXCEPTION 'invite_not_pending'; END IF;
  IF NOT (inv.employee_id = v_uid OR lower(inv.email) = lower(COALESCE(v_email,''))) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  UPDATE public.company_invites SET status='rejected', decided_at=now(), employee_id=v_uid WHERE id=_invite_id;

  INSERT INTO public.notifications (user_id, kind, title, body, href)
  SELECT c.owner_id, 'invite_rejected',
         'Punonjësi refuzoi ftesën',
         COALESCE((SELECT first_name||' '||last_name FROM public.profiles WHERE id=v_uid), inv.email)
         || ' nuk e pranoi ftesën tuaj.',
         '/employer'
  FROM public.companies c WHERE c.id = inv.company_id;

  SELECT * INTO inv FROM public.company_invites WHERE id=_invite_id;
  RETURN inv;
END $$;

-- 4. Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.company_invites;
ALTER PUBLICATION supabase_realtime ADD TABLE public.company_employees;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.favorites;
