const API_BASE = import.meta.env.VITE_API_URL ?? '';

export class ApiError extends Error {
  status: number;
  errors?: Record<string, string[]>;

  constructor(message: string, status: number, errors?: Record<string, string[]>) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors;
  }
}

let csrfInitialized = false;

export async function ensureCsrfCookie(): Promise<void> {
  if (csrfInitialized) return;
  await fetch(`${API_BASE}/sanctum/csrf-cookie`, {
    credentials: 'include',
  });
  csrfInitialized = true;
}

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[2]) : null;
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const method = (options.method ?? 'GET').toUpperCase();
  const needsCsrf = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);

  if (needsCsrf) {
    await ensureCsrfCookie();
  }

  const headers = new Headers(options.headers);
  headers.set('Accept', 'application/json');
  headers.set('X-Requested-With', 'XMLHttpRequest');

  if (!(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const xsrf = getCookie('XSRF-TOKEN');
  if (xsrf) {
    headers.set('X-XSRF-TOKEN', xsrf);
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: 'include',
    headers,
  });

  const contentType = response.headers.get('content-type');
  const data = contentType?.includes('application/json')
    ? await response.json()
    : null;

  if (!response.ok) {
    throw new ApiError(
      data?.message ?? 'Request failed.',
      response.status,
      data?.errors,
    );
  }

  return data as T;
}
