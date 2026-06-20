CREATE OR REPLACE FUNCTION public.send_gift(p_to uuid, p_amount numeric, p_message text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_gift_id uuid; v_from uuid := auth.uid();
BEGIN
  IF v_from IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF v_from = p_to THEN RAISE EXCEPTION 'Cannot gift yourself'; END IF;
  IF p_amount <= 0 THEN RAISE EXCEPTION 'Amount must be positive'; END IF;

  UPDATE public.employee_budgets
    SET used_all = used_all + p_amount
    WHERE user_id = v_from
      AND now()::date BETWEEN period_start AND period_end;

  UPDATE public.employee_budgets
    SET total_all = total_all + p_amount
    WHERE user_id = p_to
      AND now()::date BETWEEN period_start AND period_end;

  INSERT INTO public.gifts (from_user, to_user, amount_all, message)
    VALUES (v_from, p_to, p_amount, p_message)
    RETURNING id INTO v_gift_id;

  INSERT INTO public.notifications (user_id, kind, title, body, href)
    VALUES (p_to, 'gift_received',
            'Keni marrë një dhuratë! 🎁',
            COALESCE(p_message, 'Një koleg ju dërgoi përfitime.'),
            '/employee');

  RETURN v_gift_id;
END;
$function$;