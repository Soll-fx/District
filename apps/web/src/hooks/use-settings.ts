"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth, type AuthUser } from "@/lib/auth-store";
import type { DeviceSession, Profile } from "@/lib/types";

export function useProfile() {
  return useQuery({
    queryKey: ["settings", "profile"],
    queryFn: () => api.get<Profile>("/auth/me"),
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const setSession = useAuth((s) => s.setSession);
  const token = useAuth((s) => s.token);
  return useMutation({
    mutationFn: (input: {
      name?: string;
      email?: string;
      locale?: "ru" | "en";
      timezone?: string;
      avatarUrl?: string | null;
      instagram?: string | null;
      telegram?: string | null;
      youtube?: string | null;
      tradingview?: string | null;
    }) =>
      api.patch<{
        id: string;
        name?: string;
        email: string;
        locale?: "ru" | "en";
        timezone?: string;
        avatarUrl?: string | null;
        instagram?: string | null;
        telegram?: string | null;
        youtube?: string | null;
        tradingview?: string | null;
      }>("/settings/profile", input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["settings", "profile"] });
      if (token) setSession(token, data as AuthUser);
    },
  });
}

export function useSendTwoFactorCode() {
  return useMutation({
    mutationFn: () =>
      api.post<{ sent: boolean; devCode?: string }>("/settings/2fa/send-code"),
  });
}

export function useEnableTwoFactor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (code: string) =>
      api.post<{ enabled: boolean; backupCodes?: string[] }>(
        "/settings/2fa/enable",
        { code },
      ),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["settings", "profile"] }),
  });
}

export function useDisableTwoFactor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (code: string) =>
      api.post<{ enabled: boolean }>("/settings/2fa/disable", { code }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["settings", "profile"] }),
  });
}

export function useSessions() {
  return useQuery({
    queryKey: ["sessions"],
    queryFn: () => api.get<DeviceSession[]>("/auth/sessions"),
  });
}

export function useRevokeSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/auth/sessions/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["sessions"] }),
  });
}

export function useRevokeOthers() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.delete("/auth/sessions"),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["sessions"] }),
  });
}
