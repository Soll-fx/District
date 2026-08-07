import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { mapIdea } from "@/lib/mappers";
import type { Idea, IdeaListResponse, IdeaStats } from "@/lib/types";

export function useIdeas(status?: string) {
  return useQuery({
    queryKey: ["ideas", status ?? "all"],
    queryFn: async () => {
      const data = await api.get<IdeaListResponse>(
        `/ideas${status && status !== "all" ? `?status=${status.toUpperCase()}` : ""}`,
      );
      return data.items.map(mapIdea);
    },
  });
}

export function useIdeaStats() {
  return useQuery({
    queryKey: ["ideas", "stats"],
    queryFn: () => api.get<IdeaStats>("/ideas/stats"),
  });
}

export type CreateIdeaInput = {
  asset: string;
  direction: "LONG" | "SHORT";
  entry?: string;
  tp?: string;
  sl?: string;
  thesis?: string;
  tvLink?: string;
};

export function useCreateIdea() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateIdeaInput) => api.post<Idea>("/ideas", input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ideas"] });
      queryClient.invalidateQueries({ queryKey: ["ideas", "stats"] });
    },
  });
}

export function useConvertIdea() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: string }) => api.post(`/ideas/${id}/convert`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ideas"] });
      queryClient.invalidateQueries({ queryKey: ["ideas", "stats"] });
      queryClient.invalidateQueries({ queryKey: ["trades"] });
    },
  });
}

export type UpdateIdeaInput = {
  asset?: string;
  direction?: "LONG" | "SHORT";
  entry?: string;
  tp?: string;
  sl?: string;
  thesis?: string;
  tvLink?: string;
};

export function useUpdateIdea() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: { id: string } & UpdateIdeaInput) =>
      api.patch(`/ideas/${id}`, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ideas"] });
      queryClient.invalidateQueries({ queryKey: ["ideas", "stats"] });
      queryClient.invalidateQueries({ queryKey: ["trades"] });
      queryClient.invalidateQueries({ queryKey: ["trades", "stats"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
    },
  });
}

export function useUpdateIdeaStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: "HIT" | "INVALID" | "ARCHIVE" | "WATCH" }) =>
      api.patch(`/ideas/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ideas"] });
      queryClient.invalidateQueries({ queryKey: ["ideas", "stats"] });
    },
  });
}

export function useDeleteIdea() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: string }) => api.delete(`/ideas/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ideas"] });
      queryClient.invalidateQueries({ queryKey: ["ideas", "stats"] });
      queryClient.invalidateQueries({ queryKey: ["trash"] });
    },
  });
}
