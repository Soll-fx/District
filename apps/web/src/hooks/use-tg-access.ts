"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export type TgUserCard = {
  id: string;
  name: string;
  avatarUrl: string | null;
  telegramId: string | null;
  telegramUsername: string | null;
  tgAccess: boolean;
  tgAccessGrantedAt: string | null;
  tgAccessRevokedAt: string | null;
  lastSeenAt: string | null;
  online: boolean;
  netPnl: number | null;
  rank: number | null;
  score: number | null;
  winRate: number | null;
  count: number;
  topAsset: string | null;
  protected: boolean;
};

export function useTgUsers() {
  return useQuery({
    queryKey: ["admin", "tg"],
    queryFn: () => api.get<TgUserCard[]>("/admin/users/tg"),
    refetchInterval: 30_000,
  });
}