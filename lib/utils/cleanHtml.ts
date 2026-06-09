/**
 * Làm sạch HTML bị lỗi từ TipTap Editor (thẻ p thừa, đóng/mở lồng nhau).
 */
export function cleanHtmlContent(html: string): string {
  if (!html) return "";

  let cleaned = html;

  // 1. Xóa thẻ p rỗng (kể cả chỉ có khoảng trắng, &nbsp;, hoặc <br>)
  cleaned = cleaned.replace(/<p>(\s|&nbsp;|<br\s*\/?>)*<\/p>/gi, "");

  // 2. Gộp nhiều thẻ đóng p liên tiếp thành một
  cleaned = cleaned.replace(/(<\/p>\s*)+/gi, "</p>");

  // 3. Gộp nhiều thẻ mở p liên tiếp thành một
  cleaned = cleaned.replace(/(<p>\s*)+/gi, "<p>");

  // 4. Xóa thẻ đóng p thừa trước block element (img, heading, list...)
  cleaned = cleaned.replace(
    /<\/p>\s*(?=<img|<h[1-6]|<ul|<ol|<blockquote|<hr|<figure|<table)/gi,
    ""
  );

  // 5. Bỏ wrap p quanh ảnh đứng một mình
  cleaned = cleaned.replace(/<p>\s*(<img[^>]*\/?>)\s*<\/p>/gi, "$1");

  // 6. Xóa thẻ đóng p thừa ở đầu chuỗi
  cleaned = cleaned.replace(/^(<\/p>\s*)+/i, "");

  // 7. Xóa khoảng trắng thừa đầu cuối
  cleaned = cleaned.trim();

  return cleaned;
}

/** Kiểm tra HTML có dấu hiệu bị lỗi cấu trúc thẻ p */
export function isHtmlMalformed(html: string): boolean {
  if (!html) return false;
  return (
    /<\/p>\s*<\/p>/i.test(html) ||
    /<p>\s*<p>/i.test(html) ||
    /<p>(\s|&nbsp;|<br\s*\/?>)*<\/p>/i.test(html)
  );
}
