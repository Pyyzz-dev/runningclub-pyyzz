-- Số lượng tham gia và ảnh sự kiện
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS participant_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS image_url text;
