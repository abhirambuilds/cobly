const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function getHeaders(customHeaders?: HeadersInit) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  const token = localStorage.getItem('cobly_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return { ...headers, ...customHeaders };
}

async function handleResponse(res: Response) {
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const message = errorData?.error?.message || 'API request failed';
    throw new Error(message);
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
