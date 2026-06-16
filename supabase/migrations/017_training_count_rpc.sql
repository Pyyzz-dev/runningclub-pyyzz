CREATE OR REPLACE FUNCTION public.increment_training_count(training_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.training_schedule
  SET participant_count = COALESCE(participant_count, 0) + 1
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
  SET participant_count = GREATEST(0, COALESCE(participant_count, 0) - 1)
  WHERE id = training_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_training_count(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.decrement_training_count(uuid) TO authenticated;
