const base = (process.env.NEXT_PUBLIC_API_URL ?? '').replace(/\/$/, '');
export const apiFileUrl = (path: string) => `${base}/api${path}`;

export function resolveMediaUrl(url?: string | null): string {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:') || url.startsWith('data:')) {
    return url;
  }
  return `${base}${url.startsWith('/') ? '' : '/'}${url}`;
}

export async function api<T>(path: string, method = 'GET', body?: unknown): Promise<T> {
  if (method !== 'GET') {
    const csrf = await fetch(`${base}/sanctum/csrf-cookie`, { credentials: 'include' });
    if (!csrf.ok) throw new Error('Could not establish a secure session.');
  }
  const token = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]*)/)?.[1];
  const response = await fetch(`${base}/api${path}`, {
    method, credentials: 'include',
    headers: { Accept: 'application/json', ...(token ? { 'X-XSRF-TOKEN': decodeURIComponent(token) } : {}), ...(body && !(body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}) },
    body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
  });
  if (response.status === 204) return undefined as T;
  const result = await response.json().catch(() => { throw new Error('The server returned an unavailable response. Please retry shortly.'); });
  if (!response.ok) throw new Error(response.status === 401 ? 'Please sign in to continue.' : result.message ?? 'The request could not be completed.');
  return result as T;
}
