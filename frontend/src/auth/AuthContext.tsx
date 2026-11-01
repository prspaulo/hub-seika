import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

export type Role = "SOCIO" | "FUNCIONARIO" | "CLIENTE";
export type User = { id: string; name: string; email: string; role: Role };

type AuthContextValue = {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<string | null>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch(`${API_URL}/api/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) throw new Error("Credenciais inválidas");
    const data = await res.json();
    setAccessToken(data.accessToken);
    setUser(data.user);
  }, []);

  const logout = useCallback(async () => {
    await fetch(`${API_URL}/api/v1/auth/logout`, { method: "POST", credentials: "include" });
    setAccessToken(null);
    setUser(null);
  }, []);

  // Tenta renovar a sessão via cookie de refresh (httpOnly). Usado tanto na
  // carga inicial do app quanto por quem consome a API ao receber 401.
  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/v1/auth/refresh`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("sem sessão ativa");
      const { accessToken: token } = await res.json();
      setAccessToken(token);
      return token as string;
    } catch {
      setAccessToken(null);
      setUser(null);
      return null;
    }
  }, []);

  useEffect(() => {
    (async () => {
      const token = await refresh();
      if (token) {
        const meRes = await fetch(`${API_URL}/api/v1/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (meRes.ok) setUser(await meRes.json());
      }
      setIsLoading(false);
    })();
  }, [refresh]);

  return (
    <AuthContext.Provider value={{ user, accessToken, isLoading, login, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de <AuthProvider>");
  return ctx;
}
