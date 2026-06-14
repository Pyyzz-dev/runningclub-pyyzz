ALTER TABLE public.training_schedule
  ADD COLUMN IF NOT EXISTS participant_count integer NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS public.training_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  training_id uuid NOT NULL REFERENCES public.training_schedule(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (training_id, user_id)
);

CREATE INDEX IF NOT EXISTS training_participants_training_id_idx
  ON public.training_participants (training_id);

CREATE INDEX IF NOT EXISTS training_participants_user_id_idx
  ON public.training_participants (user_id);

CREATE OR REPLACE FUNCTION public.increment_training_count(training_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.training_schedule
  SET participant_count = participant_count + 1
  WHERE id = training_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.decrement_training_count(training_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.training_schedule
  SET participant_count = participant_count - 1
  WHERE id = training_id
    AND participant_count > 0;
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_training_count(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.decrement_training_count(uuid) TO authenticated;

ALTER TABLE public.training_participants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "training_participants_select_own" ON public.training_participants;
DROP POLICY IF EXISTS "training_participants_select_admin" ON public.training_participants;
DROP POLICY IF EXISTS "training_participants_insert_own" ON public.training_participants;
DROP POLICY IF EXISTS "training_participants_delete_own" ON public.training_participants;

CREATE POLICY "training_participants_select_own"
  ON public.training_participants
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "training_participants_select_admin"
  ON public.training_participants
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.users
      WHERE users.id = auth.uid()
        AND users.role = 'admin'
    )
  );

CREATE POLICY "training_participants_insert_own"
  ON public.training_participants
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "training_participants_delete_own"
  ON public.training_participants
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
