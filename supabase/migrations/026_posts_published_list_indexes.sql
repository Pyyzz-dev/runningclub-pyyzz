-- Partial indexes for the public community list: published posts, newest first.
-- Title search already uses idx_posts_title_trgm from 021.
-- rollback: DROP INDEX IF EXISTS idx_posts_published_active;
-- rollback: DROP INDEX IF EXISTS idx_posts_status_published_at;

CREATE INDEX IF NOT EXISTS idx_posts_published_active
  ON public.posts (published_at DESC)
  WHERE deleted_at IS NULL AND status = 'published';

CREATE INDEX IF NOT EXISTS idx_posts_status_published_at
  ON public.posts (status, published_at DESC)
  WHERE deleted_at IS NULL;
