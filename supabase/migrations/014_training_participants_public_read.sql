DROP POLICY IF EXISTS "training_participants_select_public" ON public.training_participants;

CREATE POLICY "training_participants_select_public"
  ON public.training_participants
  FOR SELECT
  TO anon, authenticated
  USING (true);
