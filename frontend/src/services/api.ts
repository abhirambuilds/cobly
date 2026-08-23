const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const api = {
  get: async (endpoint: string, options?: RequestInit) => {
    const res = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });
    if (!res.ok) throw new Error('API request failed');
    return res.json();
  },
  post: async (endpoint: string, body: any, options?: RequestInit) => {
    const res = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error('API request failed');
    return res.json();
  }
};
