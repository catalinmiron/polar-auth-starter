// The single source of truth for the API origin — import this everywhere
// instead of re-reading import.meta.env in each file.
export const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8787'
