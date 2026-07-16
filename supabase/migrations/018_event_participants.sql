CREATE TABLE IF NOT EXISTS public.event_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  registered_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (event_id, user_id)
);

CREATE INDEX IF NOT EXISTS event_participants_event_id_idx
  ON public.event_participants (event_id);

CREATE INDEX IF NOT EXISTS event_participants_user_id_idx
  ON public.event_participants (user_id);

CREATE OR REPLACE FUNCTION public.increment_event_count(event_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.events
  SET participant_count = COALESCE(participant_count, 0) + 1
  WHERE id = event_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.decrement_event_count(event_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.events
  SET participant_count = GREATEST(0, COALESCE(participant_count, 0) - 1)
  WHERE id = event_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_event_count(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.decrement_event_count(uuid) TO authenticated;

ALTER TABLE public.event_participants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "event_participants_select_public" ON public.event_participants;
DROP POLICY IF EXISTS "event_participants_select_own" ON public.event_participants;
DROP POLICY IF EXISTS "event_participants_select_admin" ON public.event_participants;
DROP POLICY IF EXISTS "event_participants_insert_own" ON public.event_participants;
DROP POLICY IF EXISTS "event_participants_delete_own" ON public.event_participants;

CREATE POLICY "event_participants_select_public"
  ON public.event_participants
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "event_participants_insert_own"
  ON public.event_participants
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "event_participants_delete_own"
  ON public.event_participants
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
