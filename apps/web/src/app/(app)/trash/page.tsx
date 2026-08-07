"use client";

import { Trash2, RotateCcw, Trash } from "lucide-react";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty";
import { cn } from "@/lib/utils";
import { usePurgeTrash, useRestoreTrash, useTrash } from "@/hooks/use-trash";
import { useLang } from "@/lib/i18n";
import { timeLabel } from "@/lib/mappers";

const DAYS = 30;

function daysLeft(iso: string) {
  const left = DAYS - Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  return Math.max(left, 0);
}

export default function TrashPage() {
  const { data } = useTrash();
  const { t } = useLang();
  const purge = usePurgeTrash();
  const restore = useRestoreTrash();
  const items = [...(data?.trades ?? []), ...(data?.ideas ?? [])];

  return (
    <div className="space-y-5">
      <PageHeader
        title={t("page.trash.t")}
        subtitle={t("page.trash.s")}
        actions={
          items.length > 0 && (
            <button type="button" className="btn btn-ghost !text-neg hover:!text-neg" onClick={() => purge.mutate()}>
              <Trash size={15} /> {t("trash.purgeAll")}
            </button>
          )
        }
      />

      {items.length === 0 ? (
        <EmptyState
          icon={<Trash2 size={26} />}
          title={t("trash.empty.t")}
          description={t("trash.empty.s")}
        />
      ) : (
        <Card className="animate-in overflow-hidden">
          <div className="divide-y divide-card-border">
            {items.map((d) => {
              const left = daysLeft(d.deletedAt);
              return (
                <div key={d.kind + d.id} className="flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-bg/60">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-neg-bg text-neg">
                      <Trash2 size={16} />
                    </span>
                    <div>
                      <p className="text-[13.5px] font-bold text-text-1">{d.title}</p>
                      <p className="mt-0.5 text-[11.5px] font-semibold text-text-3">
                        {d.kind === "trade" ? t("trash.kind.trade") : t("trash.kind.idea")} · {t("trash.deleted")}{" "}
                        {timeLabel(d.deletedAt)} · {t("trash.autoPurge")} {left} {t("trash.days")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={cn("pill hidden sm:inline-flex", left <= 3 ? "pill-neg" : "pill-neutral")}>
                      {left <= 3 ? t("trash.expiringSoon") : `${left} ${t("trash.days")}`}
                    </span>
                    <button
                      type="button"
                      className="btn btn-ghost !px-3 !py-1.5 text-[12px]"
                      disabled={restore.isPending}
                      onClick={() => restore.mutate({ id: d.id, kind: d.kind })}
                    >
                      <RotateCcw size={13} /> {t("trash.restore")}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
