-- Allow reading basic profile fields for training participant lists (public page).
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_select_public_profile" ON public.users;

CREATE POLICY "users_select_public_profile"
  ON public.users
  FOR SELECT
  TO anon, authenticated
  USING (true);
