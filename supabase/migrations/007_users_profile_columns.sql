ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS username TEXT,
  ADD COLUMN IF NOT EXISTS remarks TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique_idx
  ON public.users (email)
  WHERE email IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS users_username_unique_idx
  ON public.users (username)
  WHERE username IS NOT NULL;
