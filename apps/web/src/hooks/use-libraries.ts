"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Asset, Strategy, Tag } from "@/lib/types";

export function useTags() {
  return useQuery({
    queryKey: ["libraries", "tags"],
    queryFn: () => api.get<Tag[]>("/libraries/tags"),
  });
}

export function useAssets() {
  return useQuery({
    queryKey: ["libraries", "assets"],
    queryFn: () => api.get<Asset[]>("/libraries/assets"),
  });
}

export function useStrategies() {
  return useQuery({
    queryKey: ["libraries", "strategies"],
    queryFn: () => api.get<Strategy[]>("/libraries/strategies"),
  });
}

export function useCreateTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { name: string; color?: string }) =>
      api.post<Tag>("/libraries/tags", input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["libraries", "tags"] }),
  });
}

export function useUpdateTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: string; name: string; color?: string }) =>
      api.put<Tag>(`/libraries/tags/${input.id}`, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["libraries", "tags"] }),
  });
}

export function useDeleteTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<{ deleted: boolean }>(`/libraries/tags/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["libraries", "tags"] }),
  });
}

export function useCreateAsset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { symbol: string; name: string; color?: string; category?: string }) =>
      api.post<Asset>("/libraries/assets", input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["libraries", "assets"] }),
  });
}

export function useCreateStrategy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { name: string; meta?: string; color?: string }) =>
      api.post<Strategy>("/libraries/strategies", input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["libraries", "strategies"] }),
  });
}
