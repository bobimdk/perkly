
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS redeemed_at timestamptz,
  ADD COLUMN IF NOT EXISTS redeemed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE OR REPLACE FUNCTION public.redeem_transaction(_reference text)
RETURNS public.transactions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE t public.transactions; is_owner boolean;
BEGIN
  SELECT * INTO t FROM public.transactions WHERE reference = _reference FOR UPDATE;
  IF t.id IS NULL THEN RAISE EXCEPTION 'code_not_found'; END IF;
  SELECT EXISTS (SELECT 1 FROM public.providers WHERE id = t.provider_id AND owner_id = auth.uid()) INTO is_owner;
  IF NOT (is_owner OR public.has_role(auth.uid(), 'admin')) THEN RAISE EXCEPTION 'forbidden'; END IF;
  IF t.redeemed_at IS NOT NULL THEN RAISE EXCEPTION 'already_redeemed'; END IF;
  UPDATE public.transactions SET redeemed_at = now(), redeemed_by = auth.uid() WHERE id = t.id;
  INSERT INTO public.notifications (user_id, kind, title, body, href)
  VALUES (t.user_id, 'benefit_redeemed', 'Benefit redeemed ✅',
          'Your benefit code ' || _reference || ' was just used.', '/employee');
  SELECT * INTO t FROM public.transactions WHERE id = t.id;
  RETURN t;
END;
$$;

GRANT EXECUTE ON FUNCTION public.redeem_transaction(text) TO authenticated;
