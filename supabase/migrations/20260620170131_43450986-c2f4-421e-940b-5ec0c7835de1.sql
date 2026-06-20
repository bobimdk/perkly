
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS skills text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS interests text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS languages text[] NOT NULL DEFAULT '{}';

CREATE TABLE IF NOT EXISTS public.profile_experiences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  company text,
  location text,
  start_date date,
  end_date date,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.profile_experiences TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profile_experiences TO authenticated;
GRANT ALL ON public.profile_experiences TO service_role;
ALTER TABLE public.profile_experiences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Experiences are publicly readable" ON public.profile_experiences FOR SELECT USING (true);
CREATE POLICY "Owners insert their experiences" ON public.profile_experiences FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owners update their experiences" ON public.profile_experiences FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owners delete their experiences" ON public.profile_experiences FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE TRIGGER update_profile_experiences_updated_at BEFORE UPDATE ON public.profile_experiences FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX IF NOT EXISTS idx_profile_experiences_user ON public.profile_experiences(user_id, start_date DESC);

CREATE TABLE IF NOT EXISTS public.profile_education (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  school text NOT NULL,
  degree text,
  field text,
  start_year int,
  end_year int,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.profile_education TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profile_education TO authenticated;
GRANT ALL ON public.profile_education TO service_role;
ALTER TABLE public.profile_education ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Education is publicly readable" ON public.profile_education FOR SELECT USING (true);
CREATE POLICY "Owners insert their education" ON public.profile_education FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owners update their education" ON public.profile_education FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owners delete their education" ON public.profile_education FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE TRIGGER update_profile_education_updated_at BEFORE UPDATE ON public.profile_education FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX IF NOT EXISTS idx_profile_education_user ON public.profile_education(user_id, start_year DESC);
