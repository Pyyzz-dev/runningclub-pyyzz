ALTER TABLE public.comments
  ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN NOT NULL DEFAULT FALSE;

-- Chuyển bình luận đã soft-delete (deleted_at) sang is_hidden
UPDATE public.comments
SET is_hidden = TRUE
WHERE deleted_at IS NOT NULL;

UPDATE public.comments
SET deleted_at = NULL
WHERE deleted_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS comments_is_hidden_idx ON public.comments (is_hidden);
