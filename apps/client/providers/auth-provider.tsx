"use client";

import { createContext, useContext } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api";
import type {
  IUser,
  LoginInput,
  RegisterInput,
} from "@taskflow/shared";

interface AuthContextType {
  user: IUser | null;
  isLoading: boolean;
  login: (data: LoginInput) => Promise<void>;
  register: (data: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<{ user: IUser }>({
    queryKey: ["auth", "me"],
    queryFn: async () => {
      const res = await apiClient.get<{ user: IUser }>("/auth/me");
      return res.data;
    },
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginInput) => {
      const res = await apiClient.post<{ user: IUser }>("/auth/login", credentials);
      return res.data;
    },
    onSuccess: (res) => {
      queryClient.setQueryData(["auth", "me"], res);
      queryClient.invalidateQueries();
      router.push("/");
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (credentials: RegisterInput) => {
      const res = await apiClient.post<{ user: IUser }>("/auth/register", credentials);
      return res.data;
    },
    onSuccess: (res) => {
      queryClient.setQueryData(["auth", "me"], res);
      queryClient.invalidateQueries();
      router.push("/");
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post<{ message: string }>("/auth/logout");
      return res.data;
    },
    onSuccess: () => {
      queryClient.setQueryData(["auth", "me"], null);
      queryClient.clear();
      router.push("/login");
    },
  });

  const login = async (data: LoginInput) => {
    await loginMutation.mutateAsync(data);
  };

  const register = async (data: RegisterInput) => {
    await registerMutation.mutateAsync(data);
  };

  const logout = async () => {
    await logoutMutation.mutateAsync();
  };

  return (
    <AuthContext.Provider
      value={{
        user: data?.user ?? null,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
