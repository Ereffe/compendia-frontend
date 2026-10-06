// Mirrors the backend's @ValidArticleIdFormat: exactly 6 alphanumeric characters.
// The backend reports a malformed id as INTERNAL_ERROR, so reject it here and render a 404 instead.
const ARTICLE_ID_PATTERN = /^[A-Za-z0-9]{6}$/;

export const isValidArticleId = (id: string): boolean => ARTICLE_ID_PATTERN.test(id);
