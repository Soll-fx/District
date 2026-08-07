"use client";

import { useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export type TradesFilters = {
  session: string;
  account: string;
  direction: string;
  result: string;
  tags: string[];
  sort: string;
  query: string;
  period: string;
};

const DEFAULTS: Omit<TradesFilters, "tags" | "query"> = {
  session: "All",
  account: "All",
  direction: "all",
  result: "all",
  sort: "date",
  period: "all",
};

export function useTradesFilters() {
  const router = useRouter();
  const sp = useSearchParams();

  const filters: TradesFilters = useMemo(() => {
    const tags = (sp.get("tags") ?? "").split(",").filter(Boolean);
    return {
      session: sp.get("session") ?? DEFAULTS.session,
      account: sp.get("account") ?? DEFAULTS.account,
      direction: sp.get("direction") ?? DEFAULTS.direction,
      result: sp.get("result") ?? DEFAULTS.result,
      tags,
      sort: sp.get("sort") ?? DEFAULTS.sort,
      query: sp.get("q") ?? "",
      period: sp.get("period") ?? DEFAULTS.period,
    };
  }, [sp]);

  const set = useCallback(
    (patch: Partial<TradesFilters>) => {
      const next = new URLSearchParams(sp.toString());
      const apply = (key: string, value: string, omit: string) => {
        if (value === omit || value === "") next.delete(key);
        else next.set(key, value);
      };
      if (patch.session !== undefined) apply("session", patch.session, "All");
      if (patch.account !== undefined) apply("account", patch.account, "All");
      if (patch.direction !== undefined) apply("direction", patch.direction, "all");
      if (patch.result !== undefined) apply("result", patch.result, "all");
      if (patch.sort !== undefined) apply("sort", patch.sort, "date");
      if (patch.query !== undefined) apply("q", patch.query, "");
      if (patch.period !== undefined) apply("period", patch.period, "all");
      if (patch.tags !== undefined) {
        if (!patch.tags.length) next.delete("tags");
        else next.set("tags", patch.tags.join(","));
      }
      const qs = next.toString();
      router.replace(`/trades${qs ? `?${qs}` : ""}`, { scroll: false });
    },
    [sp, router],
  );

  const reset = useCallback(() => {
    router.replace("/trades", { scroll: false });
  }, [router]);

  return { filters, set, reset };
}
