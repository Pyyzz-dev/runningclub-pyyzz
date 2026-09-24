-- rollback: DROP TABLE IF EXISTS public.history_comments;

CREATE TABLE IF NOT EXISTS public.history_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  history_id uuid NOT NULL REFERENCES public.club_history(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content text NOT NULL DEFAULT '',
  image_url text,
  is_anonymous boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_history_comments_history
  ON public.history_comments (history_id);

CREATE INDEX IF NOT EXISTS idx_history_comments_user
  ON public.history_comments (user_id);

CREATE INDEX IF NOT EXISTS idx_history_comments_created
  ON public.history_comments (created_at DESC);

ALTER TABLE public.history_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "history_comments_select_public" ON public.history_comments;
DROP POLICY IF EXISTS "history_comments_insert_own" ON public.history_comments;
DROP POLICY IF EXISTS "history_comments_update_own" ON public.history_comments;
DROP POLICY IF EXISTS "history_comments_delete_own" ON public.history_comments;
DROP POLICY IF EXISTS "history_comments_delete_admin" ON public.history_comments;

CREATE POLICY "history_comments_select_public"
  ON public.history_comments
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "history_comments_insert_own"
  ON public.history_comments
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "history_comments_update_own"
  ON public.history_comments
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "history_comments_delete_own"
  ON public.history_comments
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "history_comments_delete_admin"
  ON public.history_comments
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.users
      WHERE users.id = auth.uid()
        AND users.role = 'admin'
    )
  );
