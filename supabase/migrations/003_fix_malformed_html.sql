-- Dọn dẹp HTML bị lỗi (thẻ p thừa) trong posts, club_info, club_history

-- Xem bài viết bị lỗi
-- SELECT id, title, content FROM posts
-- WHERE content LIKE '%</p></p>%' OR content LIKE '%<p><p>%';

-- posts
UPDATE posts
SET content = TRIM(
  REGEXP_REPLACE(
    REGEXP_REPLACE(
      REGEXP_REPLACE(
        REGEXP_REPLACE(content, '<p>(\s|&nbsp;|<br\s*/?>)*</p>', '', 'gi'),
        '(</p>\s*)+', '</p>', 'gi'
      ),
      '(<p>\s*)+', '<p>', 'gi'
    ),
    '</p>\s*(?=<img)', '', 'gi'
  )
)
WHERE content LIKE '%</p></p>%'
   OR content LIKE '%<p><p>%'
   OR content ~ '<p>(\s|&nbsp;|<br\s*/?>)*</p>';

-- club_info
UPDATE club_info
SET content = TRIM(
  REGEXP_REPLACE(
    REGEXP_REPLACE(
      REGEXP_REPLACE(
        REGEXP_REPLACE(content, '<p>(\s|&nbsp;|<br\s*/?>)*</p>', '', 'gi'),
        '(</p>\s*)+', '</p>', 'gi'
      ),
      '(<p>\s*)+', '<p>', 'gi'
    ),
    '</p>\s*(?=<img)', '', 'gi'
  )
)
WHERE content LIKE '%</p></p>%'
   OR content LIKE '%<p><p>%'
   OR content ~ '<p>(\s|&nbsp;|<br\s*/?>)*</p>';

-- club_history
UPDATE club_history
SET content = TRIM(
  REGEXP_REPLACE(
    REGEXP_REPLACE(
      REGEXP_REPLACE(
        REGEXP_REPLACE(content, '<p>(\s|&nbsp;|<br\s*/?>)*</p>', '', 'gi'),
        '(</p>\s*)+', '</p>', 'gi'
      ),
      '(<p>\s*)+', '<p>', 'gi'
    ),
    '</p>\s*(?=<img)', '', 'gi'
  )
)
WHERE content LIKE '%</p></p>%'
   OR content LIKE '%<p><p>%'
   OR content ~ '<p>(\s|&nbsp;|<br\s*/?>)*</p>';
