// src/lib/api.js

/**
 * Returns the API base URL to use depending on environment:
 * - Local dev: use Vite proxy -> "/api"
 * - Production (Vercel): use env var VITE_API_URL (your hosted backend)
 *
 * IMPORTANT:
 * Never use 127.0.0.1 in production because that points to the user's computer.
 */
export function getApiBase() {
  // If VITE_API_URL is set (Vercel), use it.
  const envUrl = import.meta.env.VITE_API_URL;

  if (envUrl && typeof envUrl === "string" && envUrl.trim().length > 0) {
    // normalize: remove trailing slash
    return envUrl.replace(/\/+$/, "");
  }

  // fallback for local dev: Vite proxy
  return "/api";
}
