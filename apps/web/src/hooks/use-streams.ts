"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Stream } from "@/lib/types";

export function useStreams() {
  return useQuery({
    queryKey: ["streams"],
    queryFn: () => api.get<Stream[]>("/streams"),
    refetchInterval: 30_000,
  });
}

export function useCreateStream() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      title: string;
      description?: string;
      url: string;
      type: Stream["type"];
      thumbnailUrl?: string;
      fileName?: string;
      mimeType?: string;
    }) => api.post<Stream>("/streams", input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["streams"] }),
  });
}

export function useDeleteStream() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<{ ok: boolean }>(`/streams/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["streams"] }),
  });
}

export function useUploadStreamFile() {
  return useMutation({
    mutationFn: (file: File) =>
      api.upload<{ url: string; fileName: string; mimeType: string; size: number }>(
        "/streams/upload",
        file,
      ),
  });
}

export function useToggleReaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: string; emoji: string }) =>
      api.post<Stream>(`/streams/${input.id}/react`, { emoji: input.emoji }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["streams"] }),
  });
}
