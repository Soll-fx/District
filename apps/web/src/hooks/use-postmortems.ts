"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { PostMortem } from "@/lib/types";

export type PostMortemFilters = {
  result?: string;
  asset?: string;
  q?: string;
};

function queryString(filters: PostMortemFilters) {
  const params = new URLSearchParams();
  if (filters.result) params.set("result", filters.result);
  if (filters.asset) params.set("asset", filters.asset);
  if (filters.q) params.set("q", filters.q);
  const s = params.toString();
  return s ? `?${s}` : "";
}

export function usePostMortems(filters: PostMortemFilters = {}) {
  return useQuery({
    queryKey: ["postmortems", filters],
    queryFn: () => api.get<PostMortem[]>(`/postmortems${queryString(filters)}`),
  });
}

export function useTradePostMortem(tradeId: string | null) {
  return useQuery({
    queryKey: ["postmortems", { tradeId: tradeId ?? "" }],
    queryFn: () => api.get<PostMortem[]>(`/postmortems?tradeId=${tradeId}`),
    enabled: Boolean(tradeId),
  });
}

export function useSavePostMortem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ tradeId, content }: { tradeId: string; content: string }) =>
      api.post<PostMortem>("/postmortems", { tradeId, content }),
    onSuccess: (pm) => {
      queryClient.invalidateQueries({ queryKey: ["postmortems"] });
      if (pm.tradeId) {
        queryClient.invalidateQueries({
          queryKey: ["postmortems", { tradeId: pm.tradeId }],
        });
      }
    },
  });
}

export function useUpdatePostMortem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, content }: { id: string; content: string }) =>
      api.patch<PostMortem>(`/postmortems/${id}`, { content }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["postmortems"] }),
  });
}

export function useDeletePostMortem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/postmortems/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["postmortems"] }),
  });
}
