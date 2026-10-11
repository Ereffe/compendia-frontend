export function parsePageParam(pageParam: string): number | null {
    if (!/^\d+$/.test(pageParam)) return null;
    const page = Number.parseInt(pageParam, 10);
    return page >= 1 ? page - 1 : null;
}
