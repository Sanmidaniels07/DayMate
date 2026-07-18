import { useSessionStore } from "@/stores/session";

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
  }
}

/** One in-flight refresh, shared: ten simultaneous 401s = one refresh call. */
let refreshPromise: Promise<boolean> | null = null;

async function refreshSession(): Promise<boolean> {
  refreshPromise ??= (async () => {
    try {
      const storedRefresh = useSessionStore.getState().refreshToken;
      const res = await fetch(`${API_URL}/api/v1/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(storedRefresh ? { refreshToken: storedRefresh } : {}),
      });
      if (!res.ok) return false;
      const json = await res.json();
      // capture the rotated refresh token for the next refresh
      useSessionStore.getState().setSession(json.data.accessToken, json.data.user, json.data.refreshToken);
      return true;
    } catch {
      return false;
    } finally {
      refreshPromise = null;
    }
  })();
  return refreshPromise;
}

/**
 * THE fetch wrapper. Every request in the app goes through here:
 * attaches the bearer token, speaks the backend's envelope, and on 401
 * performs the silent-refresh-and-retry dance (the A6 rotation,
 * automated). Screens never see a 401 unless the session is truly dead.
 */
export async function api<T>(
  path: string,
  options: RequestInit & { skipAuth?: boolean } = {},
): Promise<T> {
  const { skipAuth, ...init } = options;

  const doFetch = () => {
    const token = useSessionStore.getState().accessToken;
    return fetch(`${API_URL}/api/v1${path}`, {
      ...init,
      credentials: 'include',
      headers: {
        ...(init.body ? { 'Content-Type': 'application/json' } : {}),
        ...(token && !skipAuth ? { Authorization: `Bearer ${token}` } : {}),
        ...init.headers,
      },
    });
  };

  let res = await doFetch();

  // The silent-refresh dance — once per request, never for auth routes.
  if (res.status === 401 && !skipAuth && !path.startsWith('/auth/')) {
    const refreshed = await refreshSession();
    if (refreshed) res = await doFetch();
    else useSessionStore.getState().clearSession();
  }

  if (res.status === 204) return undefined as T;

  const json = await res.json().catch(() => null);
  if (!res.ok) {
    const err = json?.error ?? { code: 'UNKNOWN', message: 'Something went wrong' };
    throw new ApiError(res.status, err.code, err.message, err.details);
  }
  return json as T; // { data, meta? } — callers destructure
}