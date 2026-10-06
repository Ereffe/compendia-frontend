export const publicBackendUrl = process.env.NEXT_PUBLIC_BACKEND_URL ?? "";

// `||` so an empty value (e.g. from docker-compose defaults) falls back too.
export const serverBackendUrl = process.env.BACKEND_INTERNAL_URL || publicBackendUrl;
