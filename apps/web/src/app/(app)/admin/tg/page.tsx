"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Send,
  Wifi,
  WifiOff,
  LockKeyhole,
  LockOpen,
  ShieldCheck,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { AdminTabs } from "@/components/ui/admin-tabs";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty";
import { useLang } from "@/lib/i18n";
import { useAuth } from "@/lib/auth-store";
import { useTgUsers, type TgUserCard } from "@/hooks/use-tg-access";
import { useSetTgAccess } from "@/hooks/use-admin-users";
import { ideaDateLabel } from "@/lib/mappers";
import { cn, formatMoney } from "@/lib/utils";

export default function AdminTgPage() {
  const router = useRouter();
  const { t } = useLang();
  const user = useAuth((s) => s.user);

  const isAdmin = user?.role === "ADMIN";
  useEffect(() => {
    if (user && !isAdmin) router.replace("/");
  }, [user, isAdmin, router]);

  const { data: cards, isLoading } = useTgUsers();
  const setAccess = useSetTgAccess();

  if (!isAdmin) return null;

  return (
    <div className="space-y-5">
      <PageHeader title={t("page.admin.tg.t")} subtitle={t("page.admin.tg.s")} />

      <div className="flex flex-wrap items-center gap-3">
        <AdminTabs />
        <span className="pill pill-violet ml-auto">
          <Send size={13} /> {cards?.length ?? 0}
        </span>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="card h-44 animate-pulse" />
          ))}
        </div>
      ) : !cards?.length ? (
        <EmptyState icon={<Send size={22} />} title={t("admin.tg.empty")} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {cards.map((c) => (
            <UserCard
              key={c.id}
              card={c}
              busy={setAccess.isPending}
              onToggle={() => setAccess.mutate({ id: c.id, access: !c.tgAccess })}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function UserCard({
  card,
  busy,
  onToggle,
}: {
  card: TgUserCard;
  busy: boolean;
  onToggle: () => void;
}) {
  const { t } = useLang();

  const deltas = [
    {
      label: t("admin.tg.rank"),
      value: card.rank !== null ? `#${card.rank}` : t("admin.tg.none"),
      c: "",
    },
    {
      label: t("admin.tg.totalPnl"),
      value:
        card.netPnl !== null ? `${formatMoney(card.netPnl)}` : t("admin.tg.none"),
      c: card.netPnl !== null ? (card.netPnl >= 0 ? "text-pos" : "text-neg") : "",
    },
    {
      label: t("admin.tg.topAsset"),
      value: card.topAsset ?? t("admin.tg.none"),
      c: "",
    },
  ];

  const statusNote = card.tgAccess
    ? card.tgAccessGrantedAt
      ? `${t("admin.tg.grantedAt")} ${ideaDateLabel(card.tgAccessGrantedAt)}`
      : ""
    : card.tgAccessRevokedAt
      ? `${t("admin.tg.revokedAt")} ${ideaDateLabel(card.tgAccessRevokedAt)}`
      : "";

  return (
    <Card className="flex flex-col overflow-hidden p-5">
      <div className="flex items-start gap-3.5">
        {card.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={card.avatarUrl}
            alt=""
            className="h-11 w-11 rounded-full object-cover ring-1 ring-card-border"
          />
        ) : (
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet to-teal text-[14px] font-extrabold text-white">
            {(card.name ?? "?")[0]?.toUpperCase()}
          </span>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-[15px] font-extrabold tracking-tight text-text-1">
              {card.name || t("admin.tg.none")}
            </p>
            {card.protected && (
              <span className="pill pill-violet">
                <ShieldCheck size={11} /> {t("admin.tg.protected")}
              </span>
            )}
          </div>
          <p className="truncate text-[12px] font-semibold text-text-3">
            @{card.telegramUsername ?? card.telegramId ?? t("admin.tg.none")}
          </p>
        </div>

        <span
          className={cn(
            "pill shrink-0",
            card.tgAccess ? "pill-pos" : "pill-neg",
          )}
        >
          {card.tgAccess ? <LockOpen size={11} /> : <LockKeyhole size={11} />}
          {card.tgAccess ? t("admin.tg.accessOn") : t("admin.tg.accessOff")}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-0.5 text-[11px] font-semibold text-text-3">
        <span className="font-mono">{card.telegramId}</span>
        {card.winRate !== null && (
          <span>WinRate {card.winRate}%</span>
        )}
        {card.count > 0 && (
          <span>{card.count} {t("admin.tg.trades")}</span>
        )}
      </div>

      <div className="mt-4 grid grid-cols-3 divide-x divide-card-border rounded-xl bg-neutral/4 px-1 py-2.5 text-center">
        {deltas.map((d) => (
          <div key={d.label} className="px-1.5">
            <p className="label-caps !text-[8.5px]">{d.label}</p>
            <p className={cn("num mt-0.5 truncate text-[14px] font-extrabold text-text-1", d.c)}>
              {d.value}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-[11.5px] font-semibold text-text-2">
          <span
            className={cn(
              "inline-flex h-2 w-2 rounded-full",
              card.online ? "bg-pos shadow-[0_0_8px_rgba(34,197,94,0.8)]" : "bg-neutral/40",
            )}
          />
          {card.online ? t("admin.tg.online") : t("admin.tg.offline")}
          {!card.online && card.lastSeenAt && (
            <span className="font-normal text-text-3">
              · {ideaDateLabel(card.lastSeenAt)} {t("admin.tg.lastSeen")}
            </span>
          )}
        </span>

        <button
          type="button"
          onClick={onToggle}
          disabled={busy || card.protected}
          className={cn(
            "btn cursor-pointer !px-3 !py-1.5 !text-[12px]",
            card.tgAccess
              ? "border border-neg/40 bg-neg-bg text-neg"
              : "border border-pos/40 bg-pos-bg text-pos",
          )}
        >
          {card.tgAccess ? t("admin.tg.revoke") : t("admin.tg.grant")}
        </button>
      </div>

      {statusNote && (
        <p className="mt-2 text-center text-[10.5px] font-medium text-text-3">{statusNote}</p>
      )}
    </Card>
  );
}