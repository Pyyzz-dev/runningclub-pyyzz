-- Indexes for /community/[postId] lookups (idempotent; several already exist from 024).

CREATE INDEX IF NOT EXISTS idx_comments_post_id_active
ON public.comments (post_id)
WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_posts_author_id
ON public.posts (author_id);

CREATE INDEX IF NOT EXISTS idx_posts_published_at
ON public.posts (published_at DESC);

CREATE INDEX IF NOT EXISTS idx_comments_user_id
ON public.comments (user_id);

CREATE INDEX IF NOT EXISTS idx_comments_post_id
ON public.comments (post_id);
