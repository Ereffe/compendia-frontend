export const NOTICE_PARAM = "notice";

const NOTICES = ["articleCreated", "articleImported", "articleSaved", "articleDeleted"] as const;

export type Notice = (typeof NOTICES)[number];

export const isNotice = (value: string | null): value is Notice => NOTICES.includes(value as Notice);

export const withNotice = (path: string, notice: Notice): string => `${path}?${NOTICE_PARAM}=${notice}`;

export const withoutNotice = (pathname: string, search: string): string => {
    const params = new URLSearchParams(search);
    params.delete(NOTICE_PARAM);
    const query = params.toString();
    return query ? `${pathname}?${query}` : pathname;
};
