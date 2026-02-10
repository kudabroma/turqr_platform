import React, { createContext, useContext, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { authApi } from "@/api/endpoints";
import { useSession } from "@/auth/useSession";

type AuthContextValue = {
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();

  // ✅ session restore (главное)
  const session = useSession();

  // состояние для ошибок логина (не обязательно, но удобно)
  const [authBusy, setAuthBusy] = useState(false);

  const isAuthenticated = session.isAuthed;
  const isLoading = session.isLoading || authBusy;

  async function login(username: string, password: string) {
    setAuthBusy(true);
    try {
      await authApi.login(username, password);
      // ✅ после логина просим заново проверить сессию
      await queryClient.invalidateQueries({ queryKey: ["session", "categories_probe"] });
    } finally {
      setAuthBusy(false);
    }
  }

  async function logout() {
    setAuthBusy(true);
    try {
      await authApi.logout();
      // ✅ чистим кэш, чтобы ProtectedRoute сразу выкинуло на /login
      await queryClient.invalidateQueries({ queryKey: ["session", "categories_probe"] });
      queryClient.removeQueries({ queryKey: ["session", "categories_probe"] });
    } finally {
      setAuthBusy(false);
    }
  }

  const value = useMemo(
    () => ({ isAuthenticated, isLoading, login, logout }),
    [isAuthenticated, isLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
