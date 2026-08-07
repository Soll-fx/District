"use client";

import { Sparkles, Wrench, ShieldCheck, Rocket, GitCommitHorizontal } from "lucide-react";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty";
import { cn } from "@/lib/utils";
import { useChangelog } from "@/hooks/use-changelog";
import { useLang } from "@/lib/i18n";
import { ideaDateLabel } from "@/lib/mappers";

const TYPE_META = {
  FEATURE: { label: "changelog.type.feature", cls: "pill-pos", icon: Sparkles },
  MAJOR: { label: "changelog.type.major", cls: "pill-violet", icon: Rocket },
  FIX: { label: "changelog.type.fix", cls: "pill-orange", icon: Wrench },
  SECURITY: { label: "changelog.type.security", cls: "pill-teal", icon: ShieldCheck },
} as const;

export default function ChangelogPage() {
  const { data: changes } = useChangelog();
  const { t } = useLang();

  return (
    <div className="space-y-5">
      <PageHeader title={t("page.changelog.t")} subtitle={t("page.changelog.s")} />

      <div className="mx-auto max-w-[640px]">
        {!changes?.length ? (
          <EmptyState
            icon={<GitCommitHorizontal size={26} />}
            title={t("changelog.empty.t")}
            description={t("changelog.empty.s")}
          />
        ) : (
          changes.map((c, i) => {
          const meta = TYPE_META[c.type];
          const Icon = meta.icon;
          const isFirst = i === 0;
          return (
            <div key={c.id} className="relative flex gap-4 pb-8 last:pb-0">
              {/* линия */}
              <div className="flex flex-col items-center">
                <span
                  className={cn(
                    "z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-4",
                    isFirst ? "border-card bg-hero text-white" : "border-card bg-bg text-text-3",
                  )}
                >
                  <Icon size={15} />
                </span>
                {!isFirst && <span className="mt-1 w-px flex-1 bg-card-border" />}
              </div>

              {/* точка на линии */}
              {!isFirst && (
                <span className="absolute left-[16px] top-9 h-full w-px bg-card-border" />
              )}

              <Card className={cn("card-hover flex-1 p-4", isFirst && "ring-2 ring-violet/40")}>
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className={cn("pill", meta.cls)}>
                    <Icon size={11} /> {t(meta.label)}
                  </span>
                  <span className="num text-[11px] font-bold text-text-3">
                    {ideaDateLabel(c.date)} · {c.version}
                  </span>
                  {isFirst && <span className="pill pill-neutral">{t("changelog.latest")}</span>}
                </div>
                <p className="text-[14px] font-extrabold tracking-tight text-text-1">{c.title}</p>
                <p className="mt-1 text-[12.5px] leading-relaxed text-text-2">{c.text}</p>
              </Card>
            </div>
          );
          })
        )}
      </div>
    </div>
  );
}
