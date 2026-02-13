import React, { createContext, useContext, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { authApi } from "@/api/endpoints";
import { useSession } from "@/auth/useSession";

export type AuthUser = {
  id: number;
  username: string;
  restaurant: number | null;
};

type AuthContextValue = {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: AuthUser | null;
  isSuperuser: boolean;
  // ✅ login теперь возвращает user, чтобы делать role-redirect сразу
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

  const user: AuthUser | null = session.user ?? null;
  const isSuperuser = !!user && user.restaurant === null;

  async function login(username: string, password: string): Promise<AuthUser> {
    setAuthBusy(true);
    try {
      // ❗ authApi.login может вернуть data или {data}
      const res: any = await authApi.login(username, password);
      const data: AuthUser = (res?.data ?? res) as AuthUser;

      // ✅ всегда обновляем user в кэше (важно при смене аккаунта)
      queryClient.setQueryData(["session", "user"], {
        id: data.id,
        username: data.username,
        restaurant: data.restaurant,
      });

      // ✅ обновляем probe, чтобы ProtectedRoute стал authed
      await queryClient.invalidateQueries({ queryKey: ["session", "categories_probe"] });

      return data;
    } finally {
      setAuthBusy(false);
    }
  }

  async function logout() {
    setAuthBusy(true);
    try {
      await authApi.logout();

      // ✅ чистим и probe, и user (иначе "залипает" роль)
      queryClient.removeQueries({ queryKey: ["session", "user"] });
      queryClient.removeQueries({ queryKey: ["session", "categories_probe"] });

      // можно ещё и инвалидировать, но remove уже достаточно
      await queryClient.invalidateQueries({ queryKey: ["session", "categories_probe"] });
    } finally {
      setAuthBusy(false);
    }
  }

  const value = useMemo(
    () => ({
      isAuthenticated,
      isLoading,
      user,
      isSuperuser,
      login,
      logout,
    }),
    [isAuthenticated, isLoading, user, isSuperuser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
