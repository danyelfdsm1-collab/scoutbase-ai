CREATE TYPE public.app_role AS ENUM ('treinador', 'clube', 'atleta');

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  full_name text NOT NULL DEFAULT '',
  phone text,
  account_type public.app_role NOT NULL DEFAULT 'treinador',
  org_name text,
  birth_date date,
  city text,
  state text,
  position_primary text,
  position_secondary text,
  height_cm integer,
  weight_kg integer,
  foot text,
  category text,
  photo_url text,
  bio text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Perfis de atletas sao publicos" ON public.profiles
  FOR SELECT USING (account_type = 'atleta' OR auth.uid() = id);
CREATE POLICY "Usuario cria o proprio perfil" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Usuario edita o proprio perfil" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuario ve os proprios tipos" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE TABLE public.athlete_videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  play_type text,
  position text,
  competition text,
  played_on date,
  description text,
  duration_seconds integer,
  size_bytes integer,
  storage_path text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.athlete_videos TO authenticated;
GRANT SELECT ON public.athlete_videos TO anon;
GRANT ALL ON public.athlete_videos TO service_role;
ALTER TABLE public.athlete_videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Videos de atletas sao publicos" ON public.athlete_videos
  FOR SELECT USING (true);
CREATE POLICY "Atleta gerencia os proprios videos" ON public.athlete_videos
  FOR ALL TO authenticated USING (auth.uid() = athlete_id) WITH CHECK (auth.uid() = athlete_id);

CREATE OR REPLACE FUNCTION public.enforce_video_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (SELECT count(*) FROM public.athlete_videos WHERE athlete_id = NEW.athlete_id) >= 5 THEN
    RAISE EXCEPTION 'Limite de 5 videos por atleta atingido';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER athlete_videos_limit
  BEFORE INSERT ON public.athlete_videos
  FOR EACH ROW EXECUTE FUNCTION public.enforce_video_limit();

CREATE TABLE public.athlete_evaluations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  author_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  source text NOT NULL DEFAULT 'video',
  summary text,
  scores jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.athlete_evaluations TO authenticated;
GRANT SELECT ON public.athlete_evaluations TO anon;
GRANT ALL ON public.athlete_evaluations TO service_role;
ALTER TABLE public.athlete_evaluations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Avaliacoes sao publicas" ON public.athlete_evaluations
  FOR SELECT USING (true);
CREATE POLICY "Autor cria avaliacao" ON public.athlete_evaluations
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id OR auth.uid() = athlete_id);
CREATE POLICY "Autor edita a propria avaliacao" ON public.athlete_evaluations
  FOR UPDATE TO authenticated USING (auth.uid() = author_id) WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Autor apaga a propria avaliacao" ON public.athlete_evaluations
  FOR DELETE TO authenticated USING (auth.uid() = author_id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role public.app_role;
  v_username text;
BEGIN
  v_role := COALESCE(NULLIF(NEW.raw_user_meta_data ->> 'account_type', ''), 'treinador')::public.app_role;
  v_username := COALESCE(
    NULLIF(NEW.raw_user_meta_data ->> 'username', ''),
    split_part(COALESCE(NEW.email, 'usuario'), '@', 1) || '-' || substr(NEW.id::text, 1, 4)
  );

  INSERT INTO public.profiles (id, username, full_name, phone, account_type)
  VALUES (
    NEW.id,
    v_username,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    NULLIF(NEW.raw_user_meta_data ->> 'phone', ''),
    v_role
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, v_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER profiles_touch_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();