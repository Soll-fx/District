"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { GeopoliticsPost } from "@/lib/types";

export function useGeopolitics(lang?: string) {
  return useQuery({
    queryKey: ["geopolitics", lang ?? "ru"],
    queryFn: () => api.get<GeopoliticsPost[]>(`/geopolitics${lang ? `?lang=${lang}` : ""}`),
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
}
