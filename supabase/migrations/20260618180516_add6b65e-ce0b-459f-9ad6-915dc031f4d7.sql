
-- ============ ENUMS ============
CREATE TYPE public.employee_status AS ENUM ('pending','active','removed');
CREATE TYPE public.package_status AS ENUM ('draft','submitted','approved','rejected','fulfilled','cancelled');
CREATE TYPE public.benefit_request_status AS ENUM ('pending','approved','rejected','cancelled','fulfilled');
CREATE TYPE public.transaction_status AS ENUM ('pending','succeeded','refunded','failed');

-- ============ TABLES (created first, policies later) ============
CREATE TABLE public.companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  logo_url text,
  industry text,
  city text,
  size_label text,
  monthly_default_budget_all numeric NOT NULL DEFAULT 5000,
  currency text NOT NULL DEFAULT 'ALL',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_companies_owner ON public.companies(owner_id);

CREATE TABLE public.company_employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  invite_email text,
  full_name text,
  department text,
  status public.employee_status NOT NULL DEFAULT 'pending',
  monthly_budget_all numeric,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(company_id, user_id),
  UNIQUE(company_id, invite_email)
);
CREATE INDEX idx_company_employees_company ON public.company_employees(company_id);
CREATE INDEX idx_company_employees_user ON public.company_employees(user_id);

CREATE TABLE public.employee_budgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  period_start date NOT NULL,
  period_end date NOT NULL,
  total_all numeric NOT NULL DEFAULT 0,
  used_all numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, company_id, period_start)
);
CREATE INDEX idx_employee_budgets_user ON public.employee_budgets(user_id);

CREATE TABLE public.packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  name text NOT NULL DEFAULT 'My package',
  status public.package_status NOT NULL DEFAULT 'draft',
  total_all numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_packages_user ON public.packages(user_id);

CREATE TABLE public.package_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id uuid NOT NULL REFERENCES public.packages(id) ON DELETE CASCADE,
  offer_id uuid NOT NULL REFERENCES public.offers(id) ON DELETE CASCADE,
  provider_id uuid NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  quantity int NOT NULL DEFAULT 1,
  unit_price_all numeric NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_package_items_package ON public.package_items(package_id);

CREATE TABLE public.benefit_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  package_id uuid REFERENCES public.packages(id) ON DELETE SET NULL,
  total_all numeric NOT NULL,
  note text,
  status public.benefit_request_status NOT NULL DEFAULT 'pending',
  decided_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  decided_at timestamptz,
  reject_reason text,
  auto_approved boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_benefit_requests_company ON public.benefit_requests(company_id, status);
CREATE INDEX idx_benefit_requests_user ON public.benefit_requests(user_id);

CREATE TABLE public.auto_approval_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  max_amount_all numeric NOT NULL,
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES public.benefit_requests(id) ON DELETE CASCADE,
  package_id uuid REFERENCES public.packages(id) ON DELETE SET NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  provider_id uuid NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  offer_id uuid REFERENCES public.offers(id) ON DELETE SET NULL,
  amount_all numeric NOT NULL,
  status public.transaction_status NOT NULL DEFAULT 'succeeded',
  reference text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_transactions_user ON public.transactions(user_id);
CREATE INDEX idx_transactions_company ON public.transactions(company_id);
CREATE INDEX idx_transactions_provider ON public.transactions(provider_id);

CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind text NOT NULL,
  title text NOT NULL,
  body text,
  href text,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_notifications_user ON public.notifications(user_id, is_read);

-- ============ GRANTS ============
GRANT SELECT, INSERT, UPDATE, DELETE ON public.companies, public.company_employees, public.employee_budgets, public.packages, public.package_items, public.benefit_requests, public.auto_approval_rules, public.transactions, public.notifications TO authenticated;
GRANT ALL ON public.companies, public.company_employees, public.employee_budgets, public.packages, public.package_items, public.benefit_requests, public.auto_approval_rules, public.transactions, public.notifications TO service_role;

-- ============ HELPER ============
CREATE OR REPLACE FUNCTION public.is_company_owner(_user_id uuid, _company_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT EXISTS (SELECT 1 FROM public.companies WHERE id=_company_id AND owner_id=_user_id)
$$;
REVOKE EXECUTE ON FUNCTION public.is_company_owner(uuid,uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.is_company_owner(uuid,uuid) TO authenticated, service_role;

-- ============ RLS ============
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.package_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.benefit_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auto_approval_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- companies
CREATE POLICY "Owners or admins view company" ON public.companies FOR SELECT TO authenticated USING (
  owner_id=auth.uid()
  OR public.has_role(auth.uid(),'admin')
  OR EXISTS (SELECT 1 FROM public.company_employees ce WHERE ce.company_id=companies.id AND ce.user_id=auth.uid())
);
CREATE POLICY "Employer creates own company" ON public.companies FOR INSERT TO authenticated WITH CHECK (owner_id=auth.uid() AND public.has_role(auth.uid(),'employer'));
CREATE POLICY "Owner or admin updates company" ON public.companies FOR UPDATE TO authenticated USING (owner_id=auth.uid() OR public.has_role(auth.uid(),'admin')) WITH CHECK (owner_id=auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admin deletes company" ON public.companies FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- company_employees
CREATE POLICY "Owner/admin/self view employees" ON public.company_employees FOR SELECT TO authenticated USING (
  public.is_company_owner(auth.uid(), company_id) OR public.has_role(auth.uid(),'admin') OR user_id=auth.uid()
);
CREATE POLICY "Owner adds employees" ON public.company_employees FOR INSERT TO authenticated WITH CHECK (public.is_company_owner(auth.uid(), company_id));
CREATE POLICY "Owner/self updates employee" ON public.company_employees FOR UPDATE TO authenticated USING (public.is_company_owner(auth.uid(), company_id) OR user_id=auth.uid()) WITH CHECK (public.is_company_owner(auth.uid(), company_id) OR user_id=auth.uid());
CREATE POLICY "Owner/admin removes employees" ON public.company_employees FOR DELETE TO authenticated USING (public.is_company_owner(auth.uid(), company_id) OR public.has_role(auth.uid(),'admin'));

-- employee_budgets
CREATE POLICY "Self/owner/admin view budget" ON public.employee_budgets FOR SELECT TO authenticated USING (
  user_id=auth.uid() OR public.is_company_owner(auth.uid(), company_id) OR public.has_role(auth.uid(),'admin')
);
CREATE POLICY "Owner/admin insert budget" ON public.employee_budgets FOR INSERT TO authenticated WITH CHECK (
  public.is_company_owner(auth.uid(), company_id) OR public.has_role(auth.uid(),'admin')
);
CREATE POLICY "Owner/admin update budget" ON public.employee_budgets FOR UPDATE TO authenticated USING (
  public.is_company_owner(auth.uid(), company_id) OR public.has_role(auth.uid(),'admin')
) WITH CHECK (
  public.is_company_owner(auth.uid(), company_id) OR public.has_role(auth.uid(),'admin')
);

-- packages
CREATE POLICY "Self/owner/admin view package" ON public.packages FOR SELECT TO authenticated USING (
  user_id=auth.uid()
  OR (company_id IS NOT NULL AND public.is_company_owner(auth.uid(), company_id))
  OR public.has_role(auth.uid(),'admin')
);
CREATE POLICY "Self creates package" ON public.packages FOR INSERT TO authenticated WITH CHECK (user_id=auth.uid());
CREATE POLICY "Self/owner update package" ON public.packages FOR UPDATE TO authenticated USING (
  user_id=auth.uid()
  OR (company_id IS NOT NULL AND public.is_company_owner(auth.uid(), company_id))
  OR public.has_role(auth.uid(),'admin')
) WITH CHECK (
  user_id=auth.uid()
  OR (company_id IS NOT NULL AND public.is_company_owner(auth.uid(), company_id))
  OR public.has_role(auth.uid(),'admin')
);
CREATE POLICY "Self deletes draft package" ON public.packages FOR DELETE TO authenticated USING (user_id=auth.uid());

-- package_items
CREATE POLICY "View items of viewable package" ON public.package_items FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.packages p WHERE p.id=package_id AND (
    p.user_id=auth.uid()
    OR (p.company_id IS NOT NULL AND public.is_company_owner(auth.uid(), p.company_id))
    OR public.has_role(auth.uid(),'admin')
  ))
);
CREATE POLICY "Owner of package inserts item" ON public.package_items FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.packages p WHERE p.id=package_id AND p.user_id=auth.uid())
);
CREATE POLICY "Owner of package updates item" ON public.package_items FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.packages p WHERE p.id=package_id AND p.user_id=auth.uid())
);
CREATE POLICY "Owner of package deletes item" ON public.package_items FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.packages p WHERE p.id=package_id AND p.user_id=auth.uid())
);

-- benefit_requests
CREATE POLICY "Self/owner/admin view request" ON public.benefit_requests FOR SELECT TO authenticated USING (
  user_id=auth.uid() OR public.is_company_owner(auth.uid(), company_id) OR public.has_role(auth.uid(),'admin')
);
CREATE POLICY "Self creates request" ON public.benefit_requests FOR INSERT TO authenticated WITH CHECK (user_id=auth.uid());
CREATE POLICY "Owner/self updates request" ON public.benefit_requests FOR UPDATE TO authenticated USING (
  user_id=auth.uid() OR public.is_company_owner(auth.uid(), company_id) OR public.has_role(auth.uid(),'admin')
) WITH CHECK (
  user_id=auth.uid() OR public.is_company_owner(auth.uid(), company_id) OR public.has_role(auth.uid(),'admin')
);

-- auto_approval_rules
CREATE POLICY "Owner/admin view rules" ON public.auto_approval_rules FOR SELECT TO authenticated USING (
  public.is_company_owner(auth.uid(), company_id) OR public.has_role(auth.uid(),'admin')
);
CREATE POLICY "Owner insert rules" ON public.auto_approval_rules FOR INSERT TO authenticated WITH CHECK (public.is_company_owner(auth.uid(), company_id));
CREATE POLICY "Owner update rules" ON public.auto_approval_rules FOR UPDATE TO authenticated USING (public.is_company_owner(auth.uid(), company_id)) WITH CHECK (public.is_company_owner(auth.uid(), company_id));
CREATE POLICY "Owner/admin delete rules" ON public.auto_approval_rules FOR DELETE TO authenticated USING (public.is_company_owner(auth.uid(), company_id) OR public.has_role(auth.uid(),'admin'));

-- transactions
CREATE POLICY "Self/owner/provider/admin view tx" ON public.transactions FOR SELECT TO authenticated USING (
  user_id=auth.uid()
  OR public.is_company_owner(auth.uid(), company_id)
  OR public.has_role(auth.uid(),'admin')
  OR EXISTS (SELECT 1 FROM public.providers pr WHERE pr.id=provider_id AND pr.owner_id=auth.uid())
);
CREATE POLICY "Owner/admin/self insert tx" ON public.transactions FOR INSERT TO authenticated WITH CHECK (
  public.is_company_owner(auth.uid(), company_id) OR public.has_role(auth.uid(),'admin') OR user_id=auth.uid()
);

-- notifications
CREATE POLICY "Self view notif" ON public.notifications FOR SELECT TO authenticated USING (user_id=auth.uid());
CREATE POLICY "Authenticated insert notif" ON public.notifications FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Self update notif" ON public.notifications FOR UPDATE TO authenticated USING (user_id=auth.uid()) WITH CHECK (user_id=auth.uid());
CREATE POLICY "Self delete notif" ON public.notifications FOR DELETE TO authenticated USING (user_id=auth.uid());

-- ============ TRIGGERS ============
CREATE TRIGGER trg_companies_updated BEFORE UPDATE ON public.companies FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_company_employees_updated BEFORE UPDATE ON public.company_employees FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_employee_budgets_updated BEFORE UPDATE ON public.employee_budgets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_packages_updated BEFORE UPDATE ON public.packages FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_benefit_requests_updated BEFORE UPDATE ON public.benefit_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.recalc_package_total() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE pid uuid := COALESCE(NEW.package_id, OLD.package_id);
BEGIN
  UPDATE public.packages
  SET total_all = COALESCE((SELECT SUM(quantity*unit_price_all) FROM public.package_items WHERE package_id=pid), 0),
      updated_at = now()
  WHERE id = pid;
  RETURN NULL;
END;
$$;
CREATE TRIGGER trg_package_items_recalc
AFTER INSERT OR UPDATE OR DELETE ON public.package_items
FOR EACH ROW EXECUTE FUNCTION public.recalc_package_total();

-- ============ SIMULATED PAYMENT ENGINE ============
CREATE OR REPLACE FUNCTION public.approve_benefit_request(_request_id uuid)
RETURNS public.benefit_requests
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE r public.benefit_requests; is_admin boolean;
BEGIN
  SELECT * INTO r FROM public.benefit_requests WHERE id=_request_id FOR UPDATE;
  IF r.id IS NULL THEN RAISE EXCEPTION 'request_not_found'; END IF;
  IF r.status <> 'pending' THEN RAISE EXCEPTION 'request_not_pending'; END IF;

  is_admin := public.has_role(auth.uid(),'admin');
  IF NOT (is_admin OR public.is_company_owner(auth.uid(), r.company_id) OR r.auto_approved) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  UPDATE public.benefit_requests SET status='approved', decided_by=auth.uid(), decided_at=now() WHERE id=_request_id;

  IF r.package_id IS NOT NULL THEN
    INSERT INTO public.transactions (request_id, package_id, user_id, company_id, provider_id, offer_id, amount_all, status, reference)
    SELECT r.id, r.package_id, r.user_id, r.company_id, pi.provider_id, pi.offer_id, SUM(pi.quantity*pi.unit_price_all), 'succeeded',
           'PKLY-' || substr(replace(r.id::text,'-',''),1,8)
    FROM public.package_items pi
    WHERE pi.package_id=r.package_id
    GROUP BY pi.provider_id, pi.offer_id;
    UPDATE public.packages SET status='fulfilled' WHERE id=r.package_id;
  END IF;

  UPDATE public.employee_budgets
  SET used_all = used_all + r.total_all
  WHERE user_id=r.user_id AND company_id=r.company_id
    AND now()::date BETWEEN period_start AND period_end;

  UPDATE public.benefit_requests SET status='fulfilled' WHERE id=_request_id;
  SELECT * INTO r FROM public.benefit_requests WHERE id=_request_id;

  INSERT INTO public.notifications (user_id, kind, title, body, href)
  VALUES (r.user_id, 'request_approved', 'Your benefit was approved 🎉',
          'Your request of ' || r.total_all::text || ' ALL has been approved and paid out.',
          '/employee');
  INSERT INTO public.notifications (user_id, kind, title, body, href)
  SELECT DISTINCT pr.owner_id, 'new_payment', 'You received a new booking',
         'A new Perkly transaction was credited to your account.',
         '/provider'
  FROM public.transactions t JOIN public.providers pr ON pr.id=t.provider_id
  WHERE t.request_id=_request_id AND pr.owner_id IS NOT NULL;

  RETURN r;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.approve_benefit_request(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.approve_benefit_request(uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.reject_benefit_request(_request_id uuid, _reason text)
RETURNS public.benefit_requests
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE r public.benefit_requests;
BEGIN
  SELECT * INTO r FROM public.benefit_requests WHERE id=_request_id FOR UPDATE;
  IF r.id IS NULL THEN RAISE EXCEPTION 'request_not_found'; END IF;
  IF r.status <> 'pending' THEN RAISE EXCEPTION 'request_not_pending'; END IF;
  IF NOT (public.has_role(auth.uid(),'admin') OR public.is_company_owner(auth.uid(), r.company_id)) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  UPDATE public.benefit_requests SET status='rejected', decided_by=auth.uid(), decided_at=now(), reject_reason=_reason WHERE id=_request_id;
  INSERT INTO public.notifications (user_id, kind, title, body, href)
  VALUES (r.user_id, 'request_rejected', 'Your benefit was not approved',
          COALESCE(_reason, 'Please contact your employer for details.'),
          '/employee');
  SELECT * INTO r FROM public.benefit_requests WHERE id=_request_id;
  RETURN r;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.reject_benefit_request(uuid,text) FROM public;
GRANT EXECUTE ON FUNCTION public.reject_benefit_request(uuid,text) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.submit_benefit_request(_package_id uuid, _note text)
RETURNS public.benefit_requests
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE pkg public.packages; cid uuid; total numeric; auto boolean := false; req public.benefit_requests;
BEGIN
  SELECT * INTO pkg FROM public.packages WHERE id=_package_id;
  IF pkg.id IS NULL THEN RAISE EXCEPTION 'package_not_found'; END IF;
  IF pkg.user_id <> auth.uid() THEN RAISE EXCEPTION 'forbidden'; END IF;
  IF pkg.status <> 'draft' THEN RAISE EXCEPTION 'package_not_draft'; END IF;
  total := pkg.total_all;
  IF total <= 0 THEN RAISE EXCEPTION 'empty_package'; END IF;

  cid := pkg.company_id;
  IF cid IS NULL THEN
    SELECT company_id INTO cid FROM public.company_employees
    WHERE user_id=auth.uid() AND status='active' LIMIT 1;
  END IF;
  IF cid IS NULL THEN RAISE EXCEPTION 'no_company'; END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.auto_approval_rules
    WHERE company_id=cid AND is_active=true AND max_amount_all >= total
  ) INTO auto;

  INSERT INTO public.benefit_requests (user_id, company_id, package_id, total_all, note, status, auto_approved)
  VALUES (auth.uid(), cid, _package_id, total, _note, 'pending', auto)
  RETURNING * INTO req;

  UPDATE public.packages SET status='submitted', company_id=cid WHERE id=_package_id;

  IF auto THEN
    PERFORM public.approve_benefit_request(req.id);
    SELECT * INTO req FROM public.benefit_requests WHERE id=req.id;
  ELSE
    INSERT INTO public.notifications (user_id, kind, title, body, href)
    SELECT c.owner_id, 'request_pending', 'New benefit request',
           'An employee submitted a request of ' || total::text || ' ALL for approval.',
           '/employer'
    FROM public.companies c WHERE c.id=cid;
  END IF;
  RETURN req;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.submit_benefit_request(uuid,text) FROM public;
GRANT EXECUTE ON FUNCTION public.submit_benefit_request(uuid,text) TO authenticated, service_role;
