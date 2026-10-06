/** URL pages are 1-based; returns the 0-based API page, or null for anything that isn't a positive integer. */
export function parsePageParam(pageParam: string): number | null {
    if (!/^\d+$/.test(pageParam)) return null;
    const page = Number.parseInt(pageParam, 10);
    return page >= 1 ? page - 1 : null;
}
