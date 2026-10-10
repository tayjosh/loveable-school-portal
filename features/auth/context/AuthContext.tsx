"use client";

import React, { createContext, useCallback, useContext } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { fetchCurrentUser } from "../api/fetch-current-user";
import { PORTAL_ROLES, UserData } from "../auth.definitions";
import { storage } from "@/shared/libs/storage";

interface AuthState {
  user: UserData | null;
  loading: boolean;
  refetch: () => Promise<UserData | null>;
  logout: () => void;
}

const AuthContext = createContext<AuthState>({
  user: null,
  loading: true,
  refetch: async () => null,
  logout: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const router = useRouter();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["portal-user"],
    queryFn: fetchCurrentUser,
    enabled: typeof window !== "undefined" && !!storage.getToken(),
    retry: false,
  });

  // Only school staff may use this portal. Any other account type
  // (candidate, employer, ...) is treated as signed out.
  const user =
    data && PORTAL_ROLES.includes(String(data.role).toUpperCase())
      ? data
      : null;

  const logout = useCallback(() => {
    storage.removeToken();
    queryClient.clear();
    router.replace("/sign-in");
  }, [queryClient, router]);

  const refetchUser = useCallback(async () => {
    const res = await refetch();
    const u = res.data ?? null;
    return u && PORTAL_ROLES.includes(String(u.role).toUpperCase()) ? u : null;
  }, [refetch]);

  return (
    <AuthContext.Provider
      value={{ user, loading: isLoading, refetch: refetchUser, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useUser = () => useContext(AuthContext);
