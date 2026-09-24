-- GIN trigram indexes for ILIKE search across list/admin pages
-- rollback: DROP INDEX IF EXISTS idx_posts_title_trgm;
-- rollback: DROP INDEX IF EXISTS idx_users_full_name_trgm;
-- rollback: DROP INDEX IF EXISTS idx_users_email_trgm;
-- rollback: DROP INDEX IF EXISTS idx_users_username_trgm;
-- rollback: DROP INDEX IF EXISTS idx_pending_members_full_name_trgm;
-- rollback: DROP INDEX IF EXISTS idx_pending_members_email_trgm;
-- rollback: DROP INDEX IF EXISTS idx_training_title_trgm;
-- rollback: DROP INDEX IF EXISTS idx_training_location_trgm;
-- rollback: DROP INDEX IF EXISTS idx_club_history_title_trgm;

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_posts_title_trgm
  ON public.posts USING gin (title gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_users_full_name_trgm
  ON public.users USING gin (full_name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_users_email_trgm
  ON public.users USING gin (email gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_users_username_trgm
  ON public.users USING gin (username gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_pending_members_full_name_trgm
  ON public.pending_members USING gin (full_name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_pending_members_email_trgm
  ON public.pending_members USING gin (email gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_training_title_trgm
  ON public.training_schedule USING gin (title gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_training_location_trgm
  ON public.training_schedule USING gin (location gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_club_history_title_trgm
  ON public.club_history USING gin (title gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_events_location_trgm
  ON public.events USING gin (location gin_trgm_ops);
