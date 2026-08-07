"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { PromoCode } from "@/lib/types";

export function usePromos() {
  return useQuery({
    queryKey: ["admin", "promos"],
    queryFn: () => api.get<PromoCode[]>("/admin/promos"),
  });
}

export function useCreatePromo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { code: string; durationDays: number }) =>
      api.post<PromoCode>("/admin/promos", input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "promos"] }),
  });
}

export function useUpdatePromo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: string; isActive?: boolean; durationDays?: number }) =>
      api.patch<PromoCode>(`/admin/promos/${input.id}`, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "promos"] }),
  });
}

export function useDeletePromo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<{ ok: boolean }>(`/admin/promos/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "promos"] }),
  });
}
