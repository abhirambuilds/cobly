const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const TOKEN_KEY = 'cobly_token';

/** Error thrown for any non-2xx API response. Carries the HTTP status so
 *  callers can branch on it (e.g. 401 vs 404) instead of string-matching. */
export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

function getHeaders(customHeaders?: HeadersInit) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return { ...headers, ...customHeaders };
}

async function handleResponse(res: Response) {
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const details = errorData?.error?.details;
    const firstDetail = Array.isArray(details) && details.length > 0 ? details[0].message : null;
    const message = firstDetail || errorData?.error?.message || 'API request failed';

    // Centralized session-expiry handling: a 401 while a token is present
    // means the session is no longer valid. Clear it so stale credentials
    // don't linger, and if the user is inside the authenticated app, send
    // them to the login screen. Login/register 401s carry no token, so they
    // fall through untouched and the page can show its own error.
    if (res.status === 401 && localStorage.getItem(TOKEN_KEY)) {
      localStorage.removeItem(TOKEN_KEY);
      if (window.location.pathname.startsWith('/dashboard')) {
        window.location.assign('/login');
      }
    }

    throw new ApiError(res.status, message);
  }
  return res.json();
}

export const api = {
  get: async (endpoint: string, options?: RequestInit) => {
    const res = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: getHeaders(options?.headers),
    });
    return handleResponse(res);
  },
  post: async (endpoint: string, body: unknown, options?: RequestInit) => {
    const res = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      ...options,
      headers: getHeaders(options?.headers),
      body: JSON.stringify(body),
    });
    return handleResponse(res);
  },
  patch: async (endpoint: string, body: unknown, options?: RequestInit) => {
    const res = await fetch(`${API_URL}${endpoint}`, {
      method: 'PATCH',
      ...options,
      headers: getHeaders(options?.headers),
      body: JSON.stringify(body),
    });
    return handleResponse(res);
  },
  del: async (endpoint: string, options?: RequestInit) => {
    const res = await fetch(`${API_URL}${endpoint}`, {
      method: 'DELETE',
      ...options,
      headers: getHeaders(options?.headers),
    });
    return handleResponse(res);
  }
};
