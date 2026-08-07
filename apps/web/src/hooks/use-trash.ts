"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export type TrashItem = {
  id: string;
  kind: "trade" | "idea";
  title: string;
  deletedAt: string;
  meta: Record<string, unknown>;
};

export function useTrash() {
  return useQuery({
    queryKey: ["trash"],
    queryFn: () => api.get<{ trades: TrashItem[]; ideas: TrashItem[] }>("/trash"),
  });
}

export function usePurgeTrash() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.delete<{ trades: number; ideas: number }>("/trash"),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["trash"] }),
  });
}

export function useRestoreTrash() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, kind }: { id: string; kind: "trade" | "idea" }) =>
      api.patch(`/${kind}s/${id}/restore`),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ["trash"] }),
        queryClient.invalidateQueries({ queryKey: ["trades"] }),
        queryClient.invalidateQueries({ queryKey: ["ideas"] }),
      ]),
  });
}
