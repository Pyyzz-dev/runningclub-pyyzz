-- Bucket thực tế: Running Club - CMC Global
-- Thư mục ảnh admin: History&Introduce/{introduce|history|posts}/

INSERT INTO storage.buckets (id, name, public)
VALUES ('Running Club - CMC Global', 'Running Club - CMC Global', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "running_club_public_read" ON storage.objects;
CREATE POLICY "running_club_public_read"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'Running Club - CMC Global');

DROP POLICY IF EXISTS "running_club_admin_insert" ON storage.objects;
CREATE POLICY "running_club_admin_insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'Running Club - CMC Global'
  AND EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid() AND users.role = 'admin'
  )
);

DROP POLICY IF EXISTS "running_club_admin_update" ON storage.objects;
CREATE POLICY "running_club_admin_update"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'Running Club - CMC Global'
  AND EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid() AND users.role = 'admin'
  )
);

DROP POLICY IF EXISTS "running_club_admin_delete" ON storage.objects;
CREATE POLICY "running_club_admin_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'Running Club - CMC Global'
  AND EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid() AND users.role = 'admin'
  )
);
