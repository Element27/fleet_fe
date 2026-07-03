// const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const API_BASE = import.meta.env.VITE_API_URL || ' https://fleet-be-dc5p.onrender.com';

type TokenProvider = () => Promise<string | null>;
let _getToken: TokenProvider | null = null;

export function setTokenProvider(fn: TokenProvider) {
  _getToken = fn;
}

async function authHeaders(): Promise<Record<string, string>> {
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (_getToken) {
    const token = await _getToken();
    if (token) h['Authorization'] = `Bearer ${token}`;
  }
  return h;
}

function camelCase(str: string): string {
  return str.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

function mapKeys(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map(mapKeys);
  if (typeof obj === 'object' && !(obj instanceof Date)) {
    const mapped: Record<string, any> = {};
    for (const key of Object.keys(obj)) {
      mapped[camelCase(key)] = mapKeys(obj[key]);
    }
    return mapped;
  }
  return obj;
}

async function request<T = any>(
  method: string,
  path: string,
  body?: any,
  opts: { raw?: boolean } = {}
): Promise<T> {
  const headers = await authHeaders();
  const cfg: RequestInit = { method, headers };
  if (body !== undefined) cfg.body = JSON.stringify(body);
  const res = await fetch(`${API_BASE}${path}`, cfg);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || `Request failed: ${res.status}`);
  }
  if (opts.raw) return res as any;
  const data = await res.json();
  return mapKeys(data) as T;
}

export const api = {
  get: <T = any>(path: string, opts?: { raw?: boolean }) => request<T>('GET', path, undefined, opts),
  post: <T = any>(path: string, body?: any) => request<T>('POST', path, body),
  put: <T = any>(path: string, body?: any) => request<T>('PUT', path, body),
  del: <T = any>(path: string) => request<T>('DELETE', path),
  upload: async <T = any>(path: string, formData: FormData): Promise<T> => {
    const headers: Record<string, string> = {};
    if (_getToken) {
      const token = await _getToken();
      if (token) headers['Authorization'] = `Bearer ${token}`;
    }
    const res = await fetch(`${API_BASE}${path}`, { method: 'POST', headers, body: formData });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: res.statusText }));
      throw new Error(err.message || `Upload failed: ${res.status}`);
    }
    const data = await res.json();
    return mapKeys(data) as T;
  },
};
