import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { ProfileMetric } from "@/lib/types";

export function useProfileMetrics() {
  return useQuery({
    queryKey: ["rewards", "metrics"],
    queryFn: () => api.get<ProfileMetric[]>("/rewards/metrics"),
  });
}
