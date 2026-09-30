-- Query indexes for FK, filter, and ORDER BY columns used by the app.
-- Safe for existing data: CREATE INDEX IF NOT EXISTS only, no table rewrites of rows.
-- rollback:
-- DROP INDEX IF EXISTS idx_posts_author_id;
-- DROP INDEX IF EXISTS idx_posts_status;
-- DROP INDEX IF EXISTS idx_comments_user_id;
-- DROP INDEX IF EXISTS idx_comments_post_created;
-- DROP INDEX IF EXISTS idx_pending_members_approved_by;
-- DROP INDEX IF EXISTS idx_pending_members_status;
-- DROP INDEX IF EXISTS idx_users_role;
-- DROP INDEX IF EXISTS idx_events_registration_deadline;
-- DROP INDEX IF EXISTS idx_training_end_time;
-- DROP INDEX IF EXISTS idx_training_created_by;
-- DROP INDEX IF EXISTS idx_club_history_event_date;
-- DROP INDEX IF EXISTS idx_club_history_order_index;
-- DROP INDEX IF EXISTS idx_achievements_achieved_date;
-- DROP INDEX IF EXISTS idx_club_info_updated_by;
-- DROP INDEX IF EXISTS idx_password_resets_email_used;
-- DROP INDEX IF EXISTS idx_member_reset_user_id;
-- DROP INDEX IF EXISTS idx_member_reset_requested_by;
-- DROP INDEX IF EXISTS idx_member_reset_status;
-- DROP INDEX IF EXISTS idx_leaderboard_weekly_user_id;

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Posts: JOIN author + filter status (published_at / title trgm already exist)
CREATE INDEX IF NOT EXISTS idx_posts_author_id
  ON public.posts (author_id);

CREATE INDEX IF NOT EXISTS idx_posts_status
  ON public.posts (status);

-- Comments: FK user_id (post_id already indexed); list by post + created_at
CREATE INDEX IF NOT EXISTS idx_comments_user_id
  ON public.comments (user_id);

CREATE INDEX IF NOT EXISTS idx_comments_post_created
  ON public.comments (post_id, created_at);

-- Pending members: FK + admin queue
CREATE INDEX IF NOT EXISTS idx_pending_members_approved_by
  ON public.pending_members (approved_by);

CREATE INDEX IF NOT EXISTS idx_pending_members_status
  ON public.pending_members (status);

-- Users: role filter (email/username btree + unique + trgm already exist)
CREATE INDEX IF NOT EXISTS idx_users_role
  ON public.users (role);

-- Events: deadline checks (event_date / name trgm already exist)
CREATE INDEX IF NOT EXISTS idx_events_registration_deadline
  ON public.events (registration_deadline);

-- Training: range/end + FK created_by (start_time already indexed)
CREATE INDEX IF NOT EXISTS idx_training_end_time
  ON public.training_schedule (end_time);

CREATE INDEX IF NOT EXISTS idx_training_created_by
  ON public.training_schedule (created_by);

-- Club history: timeline sort (title trgm already exists)
CREATE INDEX IF NOT EXISTS idx_club_history_event_date
  ON public.club_history (event_date);

CREATE INDEX IF NOT EXISTS idx_club_history_order_index
  ON public.club_history (order_index, event_date DESC);

-- Achievements list
CREATE INDEX IF NOT EXISTS idx_achievements_achieved_date
  ON public.achievements (achieved_date DESC);

-- Club info FK
CREATE INDEX IF NOT EXISTS idx_club_info_updated_by
  ON public.club_info (updated_by);

-- Password reset lookups
CREATE INDEX IF NOT EXISTS idx_password_resets_email_used
  ON public.password_resets (email, used);

CREATE INDEX IF NOT EXISTS idx_member_reset_user_id
  ON public.member_password_reset_requests (user_id);

CREATE INDEX IF NOT EXISTS idx_member_reset_requested_by
  ON public.member_password_reset_requests (requested_by);

CREATE INDEX IF NOT EXISTS idx_member_reset_status
  ON public.member_password_reset_requests (status);

CREATE INDEX IF NOT EXISTS idx_leaderboard_weekly_user_id
  ON public.leaderboard_weekly (user_id);
