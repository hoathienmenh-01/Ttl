const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

export const TOKEN_KEY = "tienlo_token";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export function apiUrl(path: string): string {
  return `${BASE}/api${path}`;
}

export const defaultQueryFn = async ({ queryKey }: { queryKey: unknown[] }) => {
  const path = queryKey[0] as string;
  const token = getToken();
  const res = await fetch(apiUrl(path), {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Lỗi không xác định" }));
    throw Object.assign(new Error(err.error || "API error"), { status: res.status, data: err });
  }
  return res.json();
};

export async function apiPost(path: string, body?: unknown) {
  const token = getToken();
  const res = await fetch(apiUrl(path), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({ error: "Lỗi không xác định" }));
  if (!res.ok) throw Object.assign(new Error(data.error || "API error"), { status: res.status, data });
  return data;
}
