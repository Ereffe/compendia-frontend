// Public URL of the backend, inlined into the client bundle at build time.
export const publicBackendUrl = process.env.NEXT_PUBLIC_BACKEND_URL ?? "";

// URL the Next.js server uses to reach the backend. Inside Docker this is usually an
// internal hostname (e.g. http://backend:8080) that the browser cannot resolve.
// `||` so an empty value (e.g. from docker-compose defaults) falls back too.
export const serverBackendUrl = process.env.BACKEND_INTERNAL_URL || publicBackendUrl;
