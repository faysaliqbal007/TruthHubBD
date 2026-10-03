import type { User } from "../types";

const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");

function getXsrfToken(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

async function csrf(): Promise<void> {
  await fetch(`${API_URL}/sanctum/csrf-cookie`, {
    credentials: "include",
    headers: { Accept: "application/json" },
  });
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const xsrfToken = getXsrfToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...(xsrfToken ? { "X-XSRF-TOKEN": xsrfToken } : {}),
    ...(options.headers as Record<string, string>),
  };

  const response = await fetch(`${API_URL}${path}`, {
    credentials: "include",
    headers,
    ...options,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw Object.assign(new Error(data.message ?? "Something went wrong."), {
      status: response.status,
      errors: data.errors,
    });
  }
  return data;
}

export const authService = {
  currentUser: () => request<{ user: User }>("/api/user"),

  login: async (body: { email: string; password: string; remember: boolean }) => {
    await csrf();
    return request<{ user: User }>("/login", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  register: async (body: {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
  }) => {
    await csrf();
    return request<{ message: string }>("/register", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  logout: async () => {
    await csrf();
    return request<{ message: string }>("/logout", { method: "POST" });
  },

  updateProfile: async (body: { name: string; avatar?: File }) => {
    await csrf();
    if (body.avatar) {
      const formData = new FormData();
      formData.append('name', body.name);
      formData.append('avatar', body.avatar);
      formData.append('_method', 'PATCH');
      const xsrfToken = getXsrfToken();
      const headers: Record<string, string> = { Accept: 'application/json', ...(xsrfToken ? { 'X-XSRF-TOKEN': xsrfToken } : {}) };
      const response = await fetch(API_URL + '/api/profile', { method: 'POST', credentials: 'include', headers, body: formData });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw Object.assign(new Error(data.message ?? 'Error'), { status: response.status });
      return data as { user: User };
    }
    return request<{ user: User }>('/api/profile', {
      method: 'PATCH',
      body: JSON.stringify({ name: body.name }),
    });
  },

  /** Send a password reset link to the user's email */
  forgotPassword: async (email: string) => {
    return request<{ message: string }>("/api/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  },

  /** Reset password using 6-digit code or link token */
  resetPassword: async (body: {
    code?: string;
    token?: string;
    email: string;
    password: string;
    password_confirmation: string;
  }) => {
    return request<{ message: string }>("/api/reset-password", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  /** Resend email verification notification */
  resendVerification: async (email: string) => {
    await csrf();
    return request<{ message: string }>("/email/verification-notification", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  },

  /** Verify email using 6-digit verification code */
  verifyCode: async (body: { email: string; code: string }) => {
    await csrf();
    return request<{ message: string; user?: User }>("/email/verify-code", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  googleUrl: `${API_URL}/auth/google/redirect`,
};



