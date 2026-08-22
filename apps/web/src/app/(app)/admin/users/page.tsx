"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Users as UsersIcon,
  Globe,
  CalendarDays,
  AtSign,
  Wallet,
  Ban,
  Check,
  BarChart3,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { AdminTabs } from "@/components/ui/admin-tabs";
import { Card } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { EmptyState } from "@/components/ui/empty";
import { useLang } from "@/lib/i18n";
import { useAuth } from "@/lib/auth-store";
import { useAdminUser, useAdminUsers, useBanUser } from "@/hooks/use-admin-users";
import { ideaDateLabel } from "@/lib/mappers";
import { ccToFlag } from "@/lib/flag";
import { cn } from "@/lib/utils";

export default function AdminUsersPage() {
  const router = useRouter();
  const { t } = useLang();
  const user = useAuth((s) => s.user);

  const isAdmin = user?.role === "ADMIN";
  useEffect(() => {
    if (user && !isAdmin) router.replace("/");
  }, [user, isAdmin, router]);

  const { data: users, isLoading } = useAdminUsers();
  const banUser = useBanUser();
  const [q, setQ] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [confirmBan, setConfirmBan] = useState(false);
  const profile = useAdminUser(openId);

  if (!isAdmin) return null;

  const filtered = useMemo(() => {
    if (!users) return [];
    const s = q.trim().toLowerCase();
    if (!s) return users;
    return users.filter(
      (u) =>
        u.name?.toLowerCase().includes(s) ||
        u.email.toLowerCase().includes(s) ||
        u.promoCode?.toLowerCase().includes(s),
    );
  }, [users, q]);

  const closeCard = () => {
    setOpenId(null);
    setConfirmBan(false);
  };

  return (
    <div className="space-y-5">
      <PageHeader title={t("page.admin.users.t")} subtitle={t("page.admin.users.s")} />

      <div className="flex flex-wrap items-center gap-3">
        <AdminTabs />
        <span className="pill pill-violet ml-auto">
          <UsersIcon size={13} /> {filtered.length}
        </span>
      </div>

      <div className="relative">
        <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-text-3" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t("admin.users.search")}
          className="field pl-10"
        />
      </div>

      {isLoading ? (
        <div className="grid gap-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="card h-16 animate-pulse" />
          ))}
        </div>
      ) : !filtered.length ? (
        <EmptyState icon={<UsersIcon size={22} />} title={t("admin.users.empty")} />
      ) : (
        <Card className="divide-y divide-card-border overflow-hidden">
          {filtered.map((u) => {
            const flag = ccToFlag(u.country);
            return (
              <button
                key={u.id}
                type="button"
                onClick={() => setOpenId(u.id)}
                className="flex w-full flex-wrap items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-white/[0.03]"
              >
                {u.avatarUrl ? (
                  <img src={u.avatarUrl} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover" />
                ) : (
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet to-teal text-[13px] font-extrabold text-white">
                    {(u.name ?? u.email)[0].toUpperCase()}
                  </span>
                )}

                <span className="min-w-0">
                  <span className="block truncate text-[14px] font-bold text-text-1">
                    {flag ? `${flag} ` : ""}
                    {u.name || "—"}
                  </span>
                  <span className="block truncate text-[12px] font-medium text-text-3">{u.email}</span>
                </span>

                {u.role === "ADMIN" && <span className="pill pill-violet">ADMIN</span>}
                {u.banned && <span className="pill pill-neg">{t("admin.users.banned")}</span>}

                <span className={cn("pill", u.promoCode ? "pill-pos" : "pill-neutral")}>
                  {u.promoCode ? u.promoCode : t("admin.users.noPromo")}
                </span>

                <span className="ml-auto text-[12px] font-semibold text-text-3">{ideaDateLabel(u.createdAt)}</span>
              </button>
            );
          })}
        </Card>
      )}

      <Modal open={!!openId} onClose={closeCard} title={t("admin.users.card")}>
        {profile.isLoading || !profile.data ? (
          <div className="h-48 animate-pulse rounded-xl bg-card-border/50" />
        ) : (
          <ProfileCardBody
            data={profile.data}
            confirmBan={confirmBan}
            setConfirmBan={setConfirmBan}
            onToggleBan={() => {
              banUser.mutate(
                { id: profile.data!.id, banned: !profile.data!.banned },
                { onSettled: () => setConfirmBan(false) },
              );
            }}
            banning={banUser.isPending}
          />
        )}
      </Modal>
    </div>
  );
}

function ProfileCardBody({
  data,
  confirmBan,
  setConfirmBan,
  onToggleBan,
  banning,
}: {
  data: NonNullable<ReturnType<typeof useAdminUser>["data"]>;
  confirmBan: boolean;
  setConfirmBan: (v: boolean) => void;
  onToggleBan: () => void;
  banning: boolean;
}) {
  const { t } = useLang();
  const flag = ccToFlag(data.country);

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-4">
        {data.avatarUrl ? (
          <img src={data.avatarUrl} alt="" className="h-16 w-16 rounded-full object-cover" />
        ) : (
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-violet to-teal text-[20px] font-extrabold text-white">
            {(data.name ?? data.email)[0].toUpperCase()}
          </span>
        )}
        <div className="min-w-0">
          <div className="truncate text-[16px] font-extrabold text-text-1">
            {flag ? `${flag} ` : ""}
            {data.name || "—"}
          </div>
          <div className="truncate text-[13px] font-medium text-text-3">{data.email}</div>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {data.role === "ADMIN" && <span className="pill pill-violet">ADMIN</span>}
            {data.twoFactorEnabled && <span className="pill pill-neutral">2FA</span>}
            {data.banned && <span className="pill pill-neg">{t("admin.users.banned")}</span>}
          </div>
        </div>
      </div>

      {/* статистика */}
      <div>
        <div className="field-label mb-1.5">
          <BarChart3 size={12} className="mr-1 inline" />
          {t("admin.users.stats")}
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          <div className="rounded-lg border border-card-border px-3 py-2.5 text-center">
            <div className="text-[18px] font-extrabold text-text-1">{data.stats.tradesCount}</div>
            <div className="text-[11px] font-semibold text-text-3">{t("admin.users.trades")}</div>
          </div>
          <div className="rounded-lg border border-card-border px-3 py-2.5 text-center">
            <div
              className={cn(
                "text-[18px] font-extrabold",
                data.stats.totalPnl >= 0 ? "text-pos" : "text-neg",
              )}
            >
              {data.stats.totalPnl >= 0 ? "+" : ""}
              {Math.round(data.stats.totalPnl).toLocaleString()}
            </div>
            <div className="text-[11px] font-semibold text-text-3">{t("admin.users.totalPnl")}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        <InfoRow
          icon={<CalendarDays size={14} />}
          label={t("admin.users.joined")}
          value={ideaDateLabel(data.createdAt)}
        />
        <InfoRow
          icon={<Globe size={14} />}
          label={t("admin.users.locale")}
          value={`${data.locale} · ${data.timezone}`}
        />
        {flag && (
          <InfoRow
            icon={<span className="text-[14px] leading-none">{flag}</span>}
            label={t("admin.users.country")}
            value={data.country ?? ""}
          />
        )}
      </div>

      {(data.instagram || data.telegram || data.youtube || data.tradingview) && (
        <div>
          <div className="field-label mb-1.5">{t("admin.users.socials")}</div>
          <div className="flex flex-wrap gap-1.5">
            {(["instagram", "telegram", "youtube", "tradingview"] as const).map((k) =>
              data[k] ? (
                <span key={k} className="pill pill-neutral">
                  <AtSign size={11} /> {data[k]}
                </span>
              ) : null,
            )}
          </div>
        </div>
      )}

      <div>
        <div className="field-label mb-1.5">{t("admin.users.promos")}</div>
        {data.promos.length ? (
          <div className="space-y-1.5">
            {data.promos.map((p) => (
              <div
                key={p.code + p.activatedAt}
                className="flex items-center gap-2.5 rounded-lg border border-card-border px-3 py-2"
              >
                <span className="font-mono text-[13px] font-extrabold tracking-wide text-text-1">{p.code}</span>
                <span className="ml-auto text-[12px] font-semibold text-text-3">{ideaDateLabel(p.activatedAt)}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-card-border px-3 py-2.5 text-[12.5px] font-medium text-text-3">
            {t("admin.users.noPromo")}
          </div>
        )}
      </div>

      {!!data.accounts.length && (
        <div>
          <div className="field-label mb-1.5">{t("admin.users.accounts")}</div>
          <div className="space-y-1.5">
            {data.accounts.map((a) => (
              <div key={a.name} className="flex items-center gap-2.5 rounded-lg border border-card-border px-3 py-2">
                <Wallet size={14} className="text-text-3" />
                <span className="truncate text-[13px] font-semibold text-text-1">{a.name}</span>
                <span className="ml-auto text-[13px] font-extrabold text-text-1">
                  {Math.round(a.balance).toLocaleString()} {a.currency}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* бан */}
      <div className="rounded-xl border border-dashed p-3.5" style={{ borderColor: "rgba(255,90,90,0.35)" }}>
        <button
          type="button"
          onClick={() => (confirmBan ? onToggleBan() : setConfirmBan(true))}
          disabled={banning}
          className={cn(
            "btn w-full cursor-pointer justify-center",
            data.banned
              ? "border border-pos/40 bg-pos-bg text-pos hover:brightness-110"
              : confirmBan
                ? "bg-neg text-white"
                : "border border-neg/40 bg-neg-bg text-neg",
          )}
        >
          {confirmBan && !data.banned ? <Check size={15} /> : <Ban size={15} />}
          {data.banned
            ? t("admin.users.unban")
            : confirmBan
              ? t("admin.users.banConfirm")
              : t("admin.users.ban")}
        </button>
        <div className="mt-2 text-center text-[11.5px] font-medium text-text-3">
          {data.banned ? t("admin.users.unbanNote") : t("admin.users.banNote")}
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2.5 rounded-lg border border-card-border px-3 py-2.5">
      <span className="text-text-3">{icon}</span>
      <span className="text-[12px] font-semibold text-text-3">{label}</span>
      <span className="ml-auto truncate text-[12.5px] font-bold text-text-1">{value}</span>
    </div>
  );
}
