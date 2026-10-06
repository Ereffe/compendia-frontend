const ARTICLE_ID_PATTERN = /^[A-Za-z0-9]{6}$/;

export const isValidArticleId = (id: string): boolean => ARTICLE_ID_PATTERN.test(id);
