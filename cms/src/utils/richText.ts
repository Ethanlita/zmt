const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

export const extractPlainText = (value: string): string => {
  if (!value) {
    return '';
  }

  try {
    if (typeof DOMParser !== 'undefined') {
      const parser = new DOMParser();
      const doc = parser.parseFromString(value, 'text/html');
      const text = doc.body.textContent || '';
      return text.replace(/\s+/g, ' ').trim();
    }
  } catch {
    // fallback to regex approach below
  }

  return value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
};

export const plainTextToRichText = (value: string): string => {
  const trimmed = value?.trim();
  if (!trimmed) {
    return '';
  }

  const safe = escapeHtml(trimmed);
  const paragraphs = safe
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  if (!paragraphs.length) {
    return `<p>${safe.replace(/\n/g, '<br />')}</p>`;
  }

  return paragraphs
    .map((paragraph) => `<p>${paragraph.replace(/\n/g, '<br />')}</p>`)
    .join('');
};

