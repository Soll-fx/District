"use client";

import { Eye, EyeOff } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { useProfileMetrics } from "@/hooks/use-feed";
import { useLang } from "@/lib/i18n";

export type Metric = {
  key: string;
  label: string;
  value: string;
  category: "PROP" | "TOURNAMENT" | "TRADING" | "COMMUNITY";
  visible: boolean;
};

export const CATEGORY_COLOR: Record<Metric["category"], string> = {
  PROP: "pill-violet",
  TOURNAMENT: "pill-orange",
  TRADING: "pill-teal",
  COMMUNITY: "pill-neutral",
};

export function MetricsEditor() {
  const queryClient = useQueryClient();
  const { t } = useLang();
  const { data } = useProfileMetrics();
  const metrics: Metric[] = data ?? [];
  const visibleCount = metrics.filter((m) => m.visible).length;

  const toggle = async (key: string) => {
    await api.patch(`/rewards/metrics/${key}`);
    await queryClient.invalidateQueries({ queryKey: ["rewards", "metrics"] });
  };

  return (
    <Card className="animate-in p-5">
      <div className="mb-1 flex items-center justify-between">
        <h2 className="text-[15px] font-extrabold tracking-tight text-text-1">{t("metrics.title")}</h2>
        <span className="pill pill-neutral">
          {t("metrics.shown")} ({visibleCount}) / {t("metrics.available")} ({metrics.length})
        </span>
      </div>
      <p className="mb-4 text-[12.5px] text-text-2">{t("metrics.hint")}</p>

      <div className="grid gap-2 sm:grid-cols-2">
        {metrics.map((m) => (
          <button
            key={m.key}
            type="button"
            onClick={() => toggle(m.key)}
            className={cn(
              "flex items-center justify-between rounded-xl border p-3 text-left transition-colors",
              m.visible ? "border-card-border bg-card hover:bg-bg" : "border-card-border bg-bg opacity-60 hover:opacity-100",
            )}
          >
            <div className="flex items-center gap-3">
              <span className={cn("pill !px-2 !py-0.5 text-[9.5px]", CATEGORY_COLOR[m.category])}>{m.category}</span>
              <div>
                <p className="text-[13px] font-bold text-text-1">{m.label}</p>
                <p className="num text-[11.5px] text-text-3">{m.value}</p>
              </div>
            </div>
            <span
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full",
                m.visible ? "bg-violet/12 text-violet" : "bg-neutral/8 text-text-3",
              )}
            >
              {m.visible ? <Eye size={15} /> : <EyeOff size={15} />}
            </span>
          </button>
        ))}
      </div>
    </Card>
  );
}
