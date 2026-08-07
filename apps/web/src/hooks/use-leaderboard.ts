import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { LeaderboardResponse } from "@/lib/types";

export function useLeaderboard() {
  return useQuery({
    queryKey: ["rewards", "leaderboard"],
    queryFn: () => api.get<LeaderboardResponse>("/rewards/leaderboard"),
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
}
