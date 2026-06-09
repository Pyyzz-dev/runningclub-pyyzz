-- Chạy migration này trên Supabase SQL Editor nếu bảng chưa tồn tại
CREATE TABLE IF NOT EXISTS club_info (
  id TEXT PRIMARY KEY DEFAULT 'about',
  title TEXT NOT NULL DEFAULT 'Giới thiệu CLB',
  content TEXT NOT NULL DEFAULT '',
  image_url TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO club_info (id, title, content)
VALUES ('about', 'Giới thiệu CLB', '')
ON CONFLICT (id) DO NOTHING;

-- Storage bucket cho upload ảnh admin (tạo trên Supabase Dashboard hoặc):
-- INSERT INTO storage.buckets (id, name, public) VALUES ('club-assets', 'club-assets', true);
