import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { mapTrade } from "@/lib/mappers";
import type {
  AnalyticsSummary,
  EquityResponse,
  Trade,
  TradeListResponse,
  TradeStats,
} from "@/lib/types";

export function useTrades(includeDeleted = false) {
  return useQuery({
    queryKey: ["trades", includeDeleted],
    queryFn: async () => {
      const data = await api.get<TradeListResponse>(
        `/trades${includeDeleted ? "?includeDeleted=true" : ""}`,
      );
      return { ...data, items: data.items.map(mapTrade) };
    },
  });
}

export type CreateTradeInput = {
  asset: string;
  direction: "LONG" | "SHORT";
  entry?: number;
  exit?: number;
  lots?: number;
  pnl?: number;
  rMultiplier?: number;
  session?: "ASIA" | "LONDON" | "NEW_YORK";
  notes?: string;
  link?: string;
  accountId?: string;
};

export function useCreateTrade() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateTradeInput) => api.post("/trades", input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trades"] });
      queryClient.invalidateQueries({ queryKey: ["trades", "stats"] });
      queryClient.invalidateQueries({ queryKey: ["trades", "equity"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
  });
}

export function useDeleteTrade() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/trades/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trades"] });
      queryClient.invalidateQueries({ queryKey: ["trades", "stats"] });
      queryClient.invalidateQueries({ queryKey: ["trades", "equity"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
  });
}

export function useTrade(id: string | null) {
  return useQuery({
    queryKey: ["trades", id],
    queryFn: () => api.get<Trade>(`/trades/${id}`),
    enabled: !!id,
  });
}

export function useUpdateTrade() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: { id: string } & Partial<CreateTradeInput>) =>
      api.put(`/trades/${id}`, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trades"] });
      queryClient.invalidateQueries({ queryKey: ["trades", "stats"] });
      queryClient.invalidateQueries({ queryKey: ["trades", "equity"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
    },
  });
}

export function useTradeStats() {
  return useQuery({
    queryKey: ["trades", "stats"],
    queryFn: () => api.get<TradeStats>("/trades/stats"),
  });
}

export function useEquity(days = 30) {
  return useQuery({
    queryKey: ["trades", "equity", days],
    queryFn: () => api.get<EquityResponse>(`/trades/equity?days=${days}`),
    staleTime: 60_000,
  });
}

export function useAnalyticsSummary() {
  return useQuery({
    queryKey: ["analytics", "summary"],
    queryFn: () => api.get<AnalyticsSummary>("/analytics/summary"),
  });
}
