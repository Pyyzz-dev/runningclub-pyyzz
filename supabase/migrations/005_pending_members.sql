-- Bảng chờ duyệt đăng ký thành viên
CREATE TABLE IF NOT EXISTS public.pending_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS pending_members_status_idx ON public.pending_members (status);
CREATE INDEX IF NOT EXISTS pending_members_created_at_idx ON public.pending_members (created_at DESC);

ALTER TABLE public.pending_members ENABLE ROW LEVEL SECURITY;

-- Chỉ service role / admin (bước sau) truy cập; insert công khai qua server action dùng service role
CREATE POLICY "pending_members_admin_all"
  ON public.pending_members
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );
