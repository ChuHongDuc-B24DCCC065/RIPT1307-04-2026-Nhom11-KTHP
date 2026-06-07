/**
 * Loại bỏ các thẻ HTML một cách an toàn bằng DOMParser thay vì dùng Regex không an toàn.
 */
export const stripHtml = (html: string): string => {
  if (!html) return '';
  try {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || doc.body.innerText || '';
  } catch (e) {
    // Fallback an toàn trong trường hợp môi trường không hỗ trợ DOMParser
    return html.replace(/<[^>]*>/g, '');
  }
};
