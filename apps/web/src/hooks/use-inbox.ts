"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { InboxTicket, InboxTicketMessage } from "@/lib/types";

export function useTickets() {
  return useQuery({
    queryKey: ["inbox", "tickets"],
    queryFn: () => api.get<InboxTicket[]>("/inbox"),
    refetchInterval: 4_000,
  });
}

export function useTicket(id: string | null) {
  return useQuery({
    queryKey: ["inbox", "tickets", id],
    queryFn: () => api.get<InboxTicket>(`/inbox/${id}`),
    enabled: Boolean(id),
    refetchInterval: 4_000,
  });
}

export function useCreateTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { subject: string; category: string; text: string; imageUrl?: string | null }) =>
      api.post<InboxTicket>("/inbox", input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["inbox", "tickets"] }),
  });
}

export function useAddMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, text, imageUrl }: { id: string; text: string; imageUrl?: string | null }) =>
      api.post<InboxTicketMessage>(`/inbox/${id}/messages`, { text, imageUrl }),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["inbox", "tickets", id] });
      queryClient.invalidateQueries({ queryKey: ["inbox", "tickets"] });
    },
  });
}

export function useDeleteTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: string }) => api.delete(`/inbox/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["inbox", "tickets"] }),
  });
}

export function useSetTicketStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: "OPEN" | "WAITING" | "CLOSED" }) =>
      api.patch<InboxTicket>(`/inbox/${id}/status`, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["inbox", "tickets"] }),
  });
}
