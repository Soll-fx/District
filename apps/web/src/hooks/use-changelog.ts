"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { ChangelogEntry } from "@/lib/types";

export function useChangelog() {
  return useQuery({
    queryKey: ["changelog"],
    queryFn: () => api.get<ChangelogEntry[]>("/changelog"),
  });
}
