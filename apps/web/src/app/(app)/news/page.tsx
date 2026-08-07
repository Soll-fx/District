"use client";

import { useState } from "react";
import { Radio, CalendarDays } from "lucide-react";
import { MarketIcon } from "@/components/MarketIcon";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty";
import { cn } from "@/lib/utils";
import { useNews } from "@/hooks/use-news";
import { useLang } from "@/lib/i18n";

const FILTERS = [
  { key: "all", label: "news.filter.all" },
  { key: "high", label: "news.filter.high" },
  { key: "medium", label: "news.filter.medium" },
  { key: "low", label: "news.filter.low" },
] as const;

export default function NewsPage() {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["key"]>("all");
  const { t } = useLang();
  const { data: items } = useNews(filter === "all" ? undefined : filter);

  const byDate = (items ?? []).reduce<Record<string, NonNullable<typeof items>>>((acc, n) => {
    const key = new Intl.DateTimeFormat("ru-RU", {
      day: "numeric",
      month: "long",
      weekday: "long",
    }).format(new Date(n.date));
    (acc[key] ??= []).push(n);
    return acc;
  }, {});

  return (
    <div className="space-y-5">
      <PageHeader
        title={t("page.news.t")}
        subtitle={t("page.news.s")}
        actions={
          <span className="pill pill-neg">
            <Radio size={12} /> {t("geopolitics.live")}
          </span>
        }
      />

      <div className="animate-in flex flex-wrap gap-1.5">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            className={cn("chip", filter === f.key && "active")}
          >
            {t(f.label)}
          </button>
        ))}
      </div>

      {Object.keys(byDate).length === 0 ? (
        <EmptyState
          icon={<CalendarDays size={26} />}
          title={t("news.empty.t")}
          description={t("news.empty.s")}
        />
      ) : (
        Object.entries(byDate).map(([date, list]) => (
          <div key={date} className="animate-in animate-delay-1">
            <p className="label-caps mb-2 capitalize">{date}</p>
            <Card className="overflow-hidden">
              <div className="divide-y divide-card-border">
                {list.map((n) => (
                  <div key={n.id} className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-bg/60">
                    <MarketIcon symbol={n.country} size={36} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13.5px] font-bold text-text-1">{n.title}</p>
                      <p className="num mt-0.5 text-[11.5px] font-semibold text-text-3">
                        {n.time} · {t("news.fact")} {n.prev ?? "—"} · {t("news.forecast")} {n.forecast ?? "—"}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "pill shrink-0",
                        n.impact === "high" ? "pill-neg" : n.impact === "medium" ? "pill-orange" : "pill-neutral",
                      )}
                    >
                      {n.impact}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        ))
      )}
    </div>
  );
}
