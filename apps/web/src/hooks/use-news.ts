"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { NewsItem } from "@/lib/types";

export function useNews(impact?: string) {
  return useQuery({
    queryKey: ["news", impact ?? "all"],
    queryFn: () =>
      api.get<NewsItem[]>(`/news${impact ? `?impact=${impact}` : ""}`),
    refetchInterval: 5 * 60 * 1000,
  });
}
