// fetch with the 45 s provider timeout (A7).
export const PROVIDER_TIMEOUT_MS = 45_000;

// Fetch that aborts after `ms`.
export async function fetchWithTimeout(url: string, init: RequestInit, ms = PROVIDER_TIMEOUT_MS): Promise<Response> {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: ctl.signal });
  } finally {
    clearTimeout(t);
  }
}
