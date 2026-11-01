import { useCallback } from "react";
import { useAuth } from "../auth/AuthContext";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export function useApiClient() {
  const { accessToken, refresh } = useAuth();

  const request = useCallback(
    async (path: string, options: RequestInit = {}) => {
      const doFetch = (token: string | null) =>
        fetch(`${API_URL}${path}`, {
          ...options,
          credentials: "include",
          headers: {
            ...(options.body ? { "Content-Type": "application/json" } : {}),
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...options.headers,
          },
        });

      let res = await doFetch(accessToken);
      if (res.status === 401) {
        const newToken = await refresh();
        res = await doFetch(newToken);
      }
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new ApiError(body?.message ?? `Erro ${res.status}`, res.status);
      }
      if (res.status === 204) return null;
      return res.json();
    },
    [accessToken, refresh],
  );

  return {
    get: (path: string) => request(path),
    post: (path: string, data?: unknown) => request(path, { method: "POST", body: JSON.stringify(data) }),
    patch: (path: string, data?: unknown) => request(path, { method: "PATCH", body: JSON.stringify(data) }),
    put: (path: string, data?: unknown) => request(path, { method: "PUT", body: JSON.stringify(data) }),
    del: (path: string) => request(path, { method: "DELETE" }),
  };
}
