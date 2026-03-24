import React, { createContext, useContext, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { authApi, type User as AuthUser } from "@/api/endpoints";
import { useSession } from "@/auth/useSession";
import { setTokens, clearTokens } from "@/api/apiClient";


type AuthContextValue = {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: AuthUser | null;
  isSuperuser: boolean;
  login: (username: string, password: string) => Promise<AuthUser>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const session = useSession();

  const [authBusy, setAuthBusy] = useState(false);

  const isAuthenticated = session.isAuthed;
  const isLoading = session.isLoading || authBusy;

  const user = session.user;
  const isSuperuser = !!user && user.restaurant === null;

  async function login(username: string, password: string) {
    setAuthBusy(true);
    try {
      const data = await authApi.login(username, password);

      // ✅ Сохраняем JWT токены
      setTokens(data.access, data.refresh);

      queryClient.setQueryData(["session", "me"], data);

      return data;
    } finally {
      setAuthBusy(false);
    }
  }

  async function logout() {
    setAuthBusy(true);
    try {
      await authApi.logout();
      clearTokens(); // ✅ чистим токены
      queryClient.removeQueries({ queryKey: ["session", "me"] });
    } finally {
      setAuthBusy(false);
    }
  }

  const value = useMemo(
    () => ({ isAuthenticated, isLoading, user, isSuperuser, login, logout }),
    [isAuthenticated, isLoading, user, isSuperuser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
