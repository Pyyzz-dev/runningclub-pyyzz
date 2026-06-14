-- Hard-delete soft-deleted records older than 10 days, and ended trainings older than 30 days.

CREATE OR REPLACE FUNCTION public.cleanup_soft_deleted_records()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  soft_cutoff timestamptz := now() - interval '10 days';
  training_cutoff timestamptz := now() - interval '30 days';
  v_events integer := 0;
  v_history integer := 0;
  v_posts integer := 0;
  v_comments integer := 0;
  v_trainings integer := 0;
BEGIN
  DELETE FROM public.events
  WHERE deleted_at IS NOT NULL
    AND deleted_at < soft_cutoff;
  GET DIAGNOSTICS v_events = ROW_COUNT;

  DELETE FROM public.club_history
  WHERE deleted_at IS NOT NULL
    AND deleted_at < soft_cutoff;
  GET DIAGNOSTICS v_history = ROW_COUNT;

  DELETE FROM public.posts
  WHERE deleted_at IS NOT NULL
    AND deleted_at < soft_cutoff;
  GET DIAGNOSTICS v_posts = ROW_COUNT;

  -- Comments: legacy deleted_at (if column exists) + is_hidden (current soft-hide)
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'comments'
      AND column_name = 'deleted_at'
  ) THEN
    EXECUTE $sql$
      DELETE FROM public.comments
      WHERE deleted_at IS NOT NULL
        AND deleted_at < $1
    $sql$
    USING soft_cutoff;
    GET DIAGNOSTICS v_comments = ROW_COUNT;
  END IF;

  DELETE FROM public.comments
  WHERE is_hidden = TRUE
    AND created_at < soft_cutoff;
  GET DIAGNOSTICS v_comments = v_comments + ROW_COUNT;

  DELETE FROM public.training_schedule
  WHERE COALESCE(end_time, start_time) < training_cutoff;
  GET DIAGNOSTICS v_trainings = ROW_COUNT;

  RETURN jsonb_build_object(
    'soft_deleted_cutoff', soft_cutoff,
    'training_cutoff', training_cutoff,
    'deleted', jsonb_build_object(
      'events', v_events,
      'club_history', v_history,
      'posts', v_posts,
      'comments', v_comments,
      'training_schedule', v_trainings
    )
  );
END;
$$;

REVOKE ALL ON FUNCTION public.cleanup_soft_deleted_records() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cleanup_soft_deleted_records() TO service_role;
