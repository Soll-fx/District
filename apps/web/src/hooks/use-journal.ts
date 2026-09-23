"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { JournalAttachment, JournalEntry } from "@/lib/types";

type UploadedFile = {
  url: string;
  fileName: string;
  mimeType: string;
  size: number;
};

export type AttachmentInput = {
  url: string;
  fileName: string;
  mimeType?: string;
  size?: number;
};

export function useJournal() {
  return useQuery({
    queryKey: ["admin", "journal"],
    queryFn: () => api.get<JournalEntry[]>("/admin/journal"),
  });
}

export function useCreateJournalEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { title: string; content: string; attachments?: AttachmentInput[] }) =>
      api.post<JournalEntry>("/admin/journal", input),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["admin", "journal"] }),
  });
}

export function useUpdateJournalEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      id: string;
      title?: string;
      content?: string;
      attachments?: AttachmentInput[];
    }) => api.patch<JournalEntry>(`/admin/journal/${input.id}`, input),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["admin", "journal"] }),
  });
}

export function useDeleteJournalEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<{ ok: boolean }>(`/admin/journal/${id}`),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["admin", "journal"] }),
  });
}

export function useUploadJournalFile() {
  return useMutation({
    mutationFn: (file: File) =>
      api.upload<UploadedFile>("/admin/journal/upload", file),
  });
}