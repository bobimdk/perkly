
-- ============ CATEGORIES ============
CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name_sq text NOT NULL,
  name_en text NOT NULL,
  description_sq text,
  description_en text,
  icon text,
  sort_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.categories TO anon, authenticated;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Categories are public" ON public.categories FOR SELECT USING (is_active OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins manage categories - insert" ON public.categories FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins manage categories - update" ON public.categories FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins manage categories - delete" ON public.categories FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- ============ PROVIDERS ============
CREATE TYPE public.provider_status AS ENUM ('pending','active','suspended');

CREATE TABLE public.providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  tagline text,
  description text,
  logo_url text,
  cover_url text,
  website text,
  email text,
  phone text,
  city text,
  address text,
  lat numeric,
  lng numeric,
  status public.provider_status NOT NULL DEFAULT 'pending',
  rating_avg numeric NOT NULL DEFAULT 0,
  rating_count int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_providers_owner ON public.providers(owner_id);
CREATE INDEX idx_providers_status ON public.providers(status);
GRANT SELECT ON public.providers TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.providers TO authenticated;
GRANT ALL ON public.providers TO service_role;
ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view active providers" ON public.providers FOR SELECT USING (status='active' OR owner_id=auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Providers can create their own" ON public.providers FOR INSERT TO authenticated WITH CHECK (owner_id=auth.uid() AND public.has_role(auth.uid(),'provider'));
CREATE POLICY "Owners or admins update providers" ON public.providers FOR UPDATE TO authenticated USING (owner_id=auth.uid() OR public.has_role(auth.uid(),'admin')) WITH CHECK (owner_id=auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins delete providers" ON public.providers FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- ============ OFFERS ============
CREATE TYPE public.offer_status AS ENUM ('draft','pending','published','archived','rejected');

CREATE TABLE public.offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  subtitle text,
  description text,
  price_all numeric NOT NULL DEFAULT 0,
  price_eur numeric NOT NULL DEFAULT 0,
  original_price_all numeric,
  discount_percent int,
  capacity int,
  remaining int,
  available_from timestamptz,
  available_to timestamptz,
  is_limited_time boolean NOT NULL DEFAULT false,
  is_featured boolean NOT NULL DEFAULT false,
  is_trending boolean NOT NULL DEFAULT false,
  status public.offer_status NOT NULL DEFAULT 'draft',
  cover_url text,
  city text,
  rating_avg numeric NOT NULL DEFAULT 0,
  rating_count int NOT NULL DEFAULT 0,
  views_count int NOT NULL DEFAULT 0,
  favorites_count int NOT NULL DEFAULT 0,
  rejected_reason text,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_offers_provider ON public.offers(provider_id);
CREATE INDEX idx_offers_category ON public.offers(category_id);
CREATE INDEX idx_offers_status ON public.offers(status);
CREATE INDEX idx_offers_published ON public.offers(published_at DESC);
GRANT SELECT ON public.offers TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.offers TO authenticated;
GRANT ALL ON public.offers TO service_role;
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public view published offers" ON public.offers FOR SELECT USING (
  status='published'
  OR public.has_role(auth.uid(),'admin')
  OR EXISTS (SELECT 1 FROM public.providers p WHERE p.id = offers.provider_id AND p.owner_id = auth.uid())
);
CREATE POLICY "Provider owners insert offers" ON public.offers FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.providers p WHERE p.id = provider_id AND p.owner_id = auth.uid())
);
CREATE POLICY "Provider owners or admins update offers" ON public.offers FOR UPDATE TO authenticated USING (
  public.has_role(auth.uid(),'admin')
  OR EXISTS (SELECT 1 FROM public.providers p WHERE p.id = offers.provider_id AND p.owner_id = auth.uid())
) WITH CHECK (
  public.has_role(auth.uid(),'admin')
  OR EXISTS (SELECT 1 FROM public.providers p WHERE p.id = offers.provider_id AND p.owner_id = auth.uid())
);
CREATE POLICY "Provider owners or admins delete offers" ON public.offers FOR DELETE TO authenticated USING (
  public.has_role(auth.uid(),'admin')
  OR EXISTS (SELECT 1 FROM public.providers p WHERE p.id = offers.provider_id AND p.owner_id = auth.uid())
);

-- ============ OFFER IMAGES ============
CREATE TABLE public.offer_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id uuid NOT NULL REFERENCES public.offers(id) ON DELETE CASCADE,
  url text NOT NULL,
  alt text,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_offer_images_offer ON public.offer_images(offer_id);
GRANT SELECT ON public.offer_images TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.offer_images TO authenticated;
GRANT ALL ON public.offer_images TO service_role;
ALTER TABLE public.offer_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View images of viewable offers" ON public.offer_images FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.offers o WHERE o.id = offer_id AND (
    o.status='published'
    OR public.has_role(auth.uid(),'admin')
    OR EXISTS (SELECT 1 FROM public.providers p WHERE p.id = o.provider_id AND p.owner_id = auth.uid())
  ))
);
CREATE POLICY "Owners manage offer images - insert" ON public.offer_images FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.offers o JOIN public.providers p ON p.id=o.provider_id WHERE o.id=offer_id AND p.owner_id=auth.uid())
);
CREATE POLICY "Owners manage offer images - update" ON public.offer_images FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.offers o JOIN public.providers p ON p.id=o.provider_id WHERE o.id=offer_id AND p.owner_id=auth.uid())
);
CREATE POLICY "Owners or admins delete offer images" ON public.offer_images FOR DELETE TO authenticated USING (
  public.has_role(auth.uid(),'admin')
  OR EXISTS (SELECT 1 FROM public.offers o JOIN public.providers p ON p.id=o.provider_id WHERE o.id=offer_id AND p.owner_id=auth.uid())
);

-- ============ REVIEWS ============
CREATE TABLE public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id uuid NOT NULL REFERENCES public.offers(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating int NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(offer_id, user_id)
);
CREATE INDEX idx_reviews_offer ON public.reviews(offer_id);
GRANT SELECT ON public.reviews TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.reviews TO authenticated;
GRANT ALL ON public.reviews TO service_role;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Reviews are public" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Users create their own reviews" ON public.reviews FOR INSERT TO authenticated WITH CHECK (auth.uid()=user_id);
CREATE POLICY "Users update their own reviews" ON public.reviews FOR UPDATE TO authenticated USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);
CREATE POLICY "Users or admins delete reviews" ON public.reviews FOR DELETE TO authenticated USING (auth.uid()=user_id OR public.has_role(auth.uid(),'admin'));

-- ============ FAVORITES ============
CREATE TABLE public.favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  offer_id uuid NOT NULL REFERENCES public.offers(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, offer_id)
);
CREATE INDEX idx_favorites_user ON public.favorites(user_id);
GRANT SELECT, INSERT, DELETE ON public.favorites TO authenticated;
GRANT ALL ON public.favorites TO service_role;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view their favorites" ON public.favorites FOR SELECT TO authenticated USING (auth.uid()=user_id);
CREATE POLICY "Users add favorites" ON public.favorites FOR INSERT TO authenticated WITH CHECK (auth.uid()=user_id);
CREATE POLICY "Users remove favorites" ON public.favorites FOR DELETE TO authenticated USING (auth.uid()=user_id);

-- ============ TRIGGERS ============
CREATE TRIGGER trg_categories_updated BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_providers_updated BEFORE UPDATE ON public.providers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_offers_updated BEFORE UPDATE ON public.offers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_reviews_updated BEFORE UPDATE ON public.reviews FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ SEED CATEGORIES ============
INSERT INTO public.categories (slug,name_sq,name_en,description_sq,description_en,icon,sort_order) VALUES
  ('wellness','Mirëqenia','Wellness','Joga, spa, masazh dhe relaksim','Yoga, spa, massage and relaxation','sparkles',1),
  ('fitness','Fitness','Fitness','Palestra, klasa fitnesi dhe sport','Gyms, fitness classes and sports','dumbbell',2),
  ('food','Ushqim','Food & Dining','Restorante, kafene dhe ushqim i shëndetshëm','Restaurants, cafes and healthy food','utensils',3),
  ('learning','Mësim','Learning','Kurse, libra dhe zhvillim profesional','Courses, books and pro development','graduation-cap',4),
  ('travel','Udhëtim','Travel','Hotele, pushime dhe eksperienca','Hotels, getaways and experiences','plane',5),
  ('health','Shëndeti','Health','Klinika, dentist dhe konsulta mjekësore','Clinics, dentists and medical care','heart-pulse',6),
  ('family','Familja','Family','Aktivitete për fëmijë dhe familje','Kids and family activities','users',7),
  ('mobility','Lëvizshmëria','Mobility','Karburant, transport dhe makina','Fuel, transport and ride-sharing','car',8),
  ('tech','Teknologjia','Tech','Pajisje, aksesorë dhe abonime','Devices, accessories and subscriptions','laptop',9),
  ('beauty','Bukuria','Beauty','Berberi, salone dhe kujdes personal','Barbers, salons and personal care','scissors',10);
