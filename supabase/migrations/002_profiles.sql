-- Table profiles (metadata utilisateur post-inscription)
CREATE TABLE IF NOT EXISTS public.profiles (
  user_id    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  prenom     text,
  ville      text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT profiles_pkey PRIMARY KEY (user_id),
  CONSTRAINT profiles_prenom_nonempty CHECK (prenom IS NULL OR char_length(prenom) > 0)
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
