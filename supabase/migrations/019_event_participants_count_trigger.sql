-- Đồng bộ participant_count tự động khi thêm/xóa event_participants
CREATE OR REPLACE FUNCTION public.handle_event_participant_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_event_id uuid;
BEGIN
  target_event_id := COALESCE(NEW.event_id, OLD.event_id);

  UPDATE public.events
  SET participant_count = (
    SELECT COUNT(*)::integer
    FROM public.event_participants
    WHERE event_id = target_event_id
  )
  WHERE id = target_event_id;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS event_participants_count_trigger ON public.event_participants;

CREATE TRIGGER event_participants_count_trigger
  AFTER INSERT OR DELETE ON public.event_participants
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_event_participant_count();
