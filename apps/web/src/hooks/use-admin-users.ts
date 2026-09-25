"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export type AdminUserRow = {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  role: "USER" | "ADMIN";
  locale: string;
  twoFactorEnabled: boolean;
  createdAt: string;
  promoCode: string | null;
  promoActivatedAt: string | null;
  balance: number | null;
  banned: boolean;
  country: string | null;
  telegramId: string | null;
  telegramUsername: string | null;
  tgAccess: boolean;
  lastSeenAt: string | null;
};

export type AdminUserProfile = AdminUserRow & {
  timezone: string;
  instagram: string | null;
  telegram: string | null;
  youtube: string | null;
  tradingview: string | null;
  telegramPhoto: string | null;
  tgAccessGrantedAt: string | null;
  tgAccessRevokedAt: string | null;
  online: boolean;
  rank: number | null;
  score: number | null;
  netPnl: number | null;
  promos: { code: string; activatedAt: string }[];
  accounts: { name: string; balance: number; currency: string }[];
  stats: {
    totalPnl: number;
    winRate: number;
    avgR: number;
    count: number;
    wins: number;
    losses: number;
    profitFactor: number;
    avgWin: number;
    avgLoss: number;
    maxDrawdown: number;
    longCount: number;
    shortCount: number;
  };
  equityPoints: { date: string; balance: number }[];
  topAssets: { asset: string; count: number; pnl: number }[];
};

export function useAdminUsers() {
  return useQuery({
    queryKey: ["admin", "users"],
    queryFn: () => api.get<AdminUserRow[]>("/admin/users"),
  });
}

export function useAdminUser(id: string | null) {
  return useQuery({
    queryKey: ["admin", "users", id],
    queryFn: () => api.get<AdminUserProfile>(`/admin/users/${id}`),
    enabled: !!id,
  });
}

export function useBanUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: string; banned: boolean }) =>
      api.patch<{ id: string; banned: boolean }>(
        `/admin/users/${input.id}/ban`,
        { banned: input.banned },
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
  });
}

export function useSetTgAccess() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: string; access: boolean }) =>
      api.patch<{
        id: string;
        tgAccess: boolean;
        tgAccessGrantedAt: string | null;
        tgAccessRevokedAt: string | null;
      }>(`/admin/users/${input.id}/tg-access`, { access: input.access }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "tg"] });
    },
  });
}
