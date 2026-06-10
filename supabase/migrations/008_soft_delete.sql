ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

ALTER TABLE public.comments
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

ALTER TABLE public.club_history
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

ALTER TABLE public.training_schedule
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS posts_deleted_at_idx ON public.posts (deleted_at);
CREATE INDEX IF NOT EXISTS comments_deleted_at_idx ON public.comments (deleted_at);
CREATE INDEX IF NOT EXISTS club_history_deleted_at_idx ON public.club_history (deleted_at);
CREATE INDEX IF NOT EXISTS training_schedule_deleted_at_idx ON public.training_schedule (deleted_at);
CREATE INDEX IF NOT EXISTS events_deleted_at_idx ON public.events (deleted_at);
