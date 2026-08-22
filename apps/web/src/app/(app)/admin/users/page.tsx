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
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { AdminTabs } from "@/components/ui/admin-tabs";
import { Card } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { EmptyState } from "@/components/ui/empty";
import { Sparkline } from "@/components/ui/sparkline";
import { Ring } from "@/components/ui/ring";
import { useLang } from "@/lib/i18n";
import { useAuth } from "@/lib/auth-store";
import { useAdminUser, useAdminUsers, useBanUser, type AdminUserProfile } from "@/hooks/use-admin-users";
import { ideaDateLabel } from "@/lib/mappers";
import { ccToFlag } from "@/lib/flag";
import { cn, formatMoney } from "@/lib/utils";
import { SocialLinks } from "@/components/ui/social-links";

const AVATAR_COLORS = ["#7C6CF0", "#22C55E", "#F59E0B", "#3B82F6", "#EC4899"];

function initialsOf(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? "")
      .join("") || "?"
  );
}

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

      <Modal open={!!openId} onClose={closeCard} title={t("admin.users.card")} size="xl">
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
  data: AdminUserProfile;
  confirmBan: boolean;
  setConfirmBan: (v: boolean) => void;
  onToggleBan: () => void;
  banning: boolean;
}) {
  const { t, lang } = useLang();
  const flag = ccToFlag(data.country);

  const spark = useMemo(() => data.equityPoints.map((p) => p.balance), [data.equityPoints]);

  const s = data.stats;
  const totalPnl = s?.totalPnl ?? 0;
  const count = s?.count ?? 0;
  const winRate = s?.winRate ?? 0;
  const wins = s?.wins ?? 0;
  const losses = s?.losses ?? 0;
  const longCount = s?.longCount ?? 0;
  const shortCount = s?.shortCount ?? 0;
  const avgPerTrade = count > 0 ? totalPnl / count : 0;
  const longShare = longCount + shortCount > 0 ? (longCount / (longCount + shortCount)) * 100 : 0;
  const winShare = count > 0 ? (wins / count) * 100 : 0;

  const name = data.name?.trim() || data.email.split("@")[0] || "Trader";
  const username = data.email.split("@")[0];
  const avatarColor = AVATAR_COLORS[(name.length || 0) % AVATAR_COLORS.length];
  const memberSince = data.createdAt
    ? new Intl.DateTimeFormat(lang === "ru" ? "ru-RU" : "en-US", { month: "long", year: "numeric" })
        .format(new Date(data.createdAt))
        .toUpperCase()
    : "—";

  const mini = [
    { label: t("profileCard.netPnl"), value: formatMoney(totalPnl), c: totalPnl >= 0 ? "text-pos" : "text-neg" },
    { label: t("profileCard.tradeWinRate"), value: `${winRate.toFixed(0)}%` },
    { label: t("profileCard.totalTrades"), value: String(count) },
    { label: t("profileCard.avgR"), value: `${(s?.avgR ?? 0).toFixed(2)}R` },
    { label: t("profileCard.avgPnlPerTrade"), value: formatMoney(avgPerTrade), c: avgPerTrade >= 0 ? "text-pos" : "text-neg" },
    { label: t("profileCard.profitFactor"), value: (s?.profitFactor ?? 0).toFixed(2) },
  ];

  const summaryRows = [
    { label: t("profileCard.avgWin"), value: formatMoney(s?.avgWin ?? 0), c: "text-pos" },
    { label: t("profileCard.avgLoss"), value: formatMoney(-(s?.avgLoss ?? 0)), c: "text-neg" },
    { label: t("profileCard.maxDrawdown"), value: formatMoney(-(s?.maxDrawdown ?? 0)), c: "text-neg" },
  ];

  return (
    <div className="space-y-5">
      {/* ── Профиль + виджеты ── */}
      <div className="grid gap-5 md:grid-cols-4">
        <Card className="flex flex-col justify-between p-5">
          <div className="flex items-center gap-3.5">
            {data.avatarUrl ? (
              <img src={data.avatarUrl} alt={name} className="h-14 w-14 rounded-full object-cover ring-1 ring-card-border" />
            ) : (
              <span
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-[17px] font-extrabold text-white"
                style={{ background: avatarColor }}
              >
                {initialsOf(name)}
              </span>
            )}
            <div className="min-w-0">
              <p className="truncate text-[16px] font-extrabold tracking-tight text-text-1">
                {flag ? `${flag} ` : ""}
                {name}
              </p>
              <p className="truncate text-[12px] text-text-2">@{username}</p>
              {flag && (
                <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wide text-text-3">
                  {flag} {t("admin.users.country")}: {data.country}
                </p>
              )}
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-1.5">
            {data.role === "ADMIN" && <span className="pill pill-violet">ADMIN</span>}
            {data.twoFactorEnabled && <span className="pill pill-neutral">2FA</span>}
            {data.banned && <span className="pill pill-neg">{t("admin.users.banned")}</span>}
          </div>
          <div className="mt-4">
            <p className="label-caps">
              <CalendarDays size={11} className="mr-1 inline" />
              {t("profileCard.memberSince")}
            </p>
            <p className="num mt-0.5 text-[13px] font-bold text-text-1">{memberSince}</p>
          </div>
        </Card>

        <Card className="flex flex-col justify-between p-5">
          <p className="label-caps">{t("profileCard.winRate")}</p>
          <div className="my-auto flex justify-center py-3">
            <Ring value={winRate} size={108} stroke={10} color="#22C55E">
              <p className="num text-[22px] font-extrabold leading-none text-text-1">{winRate.toFixed(0)}%</p>
            </Ring>
          </div>
          <div className="flex justify-between text-[11.5px] font-semibold text-text-2">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-pos" /> {t("profileCard.wins")} {wins}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-neg" /> {t("profileCard.losses")} {losses}
            </span>
          </div>
        </Card>

        <Card className="flex flex-col justify-between p-5">
          <div>
            <p className="label-caps">{t("profileCard.pnlCurve")}</p>
            <p className={cn("num mt-1 text-[24px] font-extrabold leading-none", totalPnl >= 0 ? "text-pos" : "text-neg")}>
              {formatMoney(totalPnl)}
            </p>
            <p className="mt-0.5 text-[10.5px] font-bold uppercase tracking-wide text-text-3">{t("profileCard.cumulativePnl")}</p>
          </div>
          <div className="mt-4 flex h-11 items-end">
            <Sparkline data={spark} width={170} height={40} color={totalPnl >= 0 ? "#22C55E" : "#EF4444"} />
          </div>
        </Card>

        <Card className="flex flex-col justify-between p-5">
          <p className="label-caps">{t("profileCard.longShort")}</p>
          <div className="my-auto flex justify-center py-3">
            <Ring value={longShare} size={108} stroke={10} color="#7C6CF0">
              <div className="text-center">
                <p className="num text-[19px] font-extrabold leading-none text-text-1">
                  {longCount}/{shortCount}
                </p>
                <p className="mt-0.5 text-[9px] font-bold uppercase tracking-wide text-text-3">{t("profileCard.trades")}</p>
              </div>
            </Ring>
          </div>
          <div className="flex justify-between text-[11.5px] font-semibold text-text-2">
            <span>{t("profileCard.long")} {longCount}</span>
            <span>{t("profileCard.short")} {shortCount}</span>
          </div>
        </Card>
      </div>

      {/* ── Топ инструменты + сводка ── */}
      <div className="grid gap-5 md:grid-cols-2">
        <Card className="p-5">
          <p className="label-caps">{t("profileCard.topAssets")}</p>
          <div className="mt-3 space-y-3">
            {data.topAssets.length === 0 && <p className="text-[12.5px] text-text-3">{t("profileCard.noTrades")}</p>}
            {data.topAssets.map((a) => (
              <div key={a.asset} className="flex items-center gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-neutral/6 text-[10.5px] font-extrabold text-text-2">
                  {a.asset.slice(0, 2).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2 text-[12.5px]">
                    <span className="truncate font-bold text-text-1">{a.asset}</span>
                    <span className="num shrink-0 font-bold text-text-2">{a.count}</span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-neutral/6">
                    <div
                      className="h-full rounded-full bg-teal"
                      style={{
                        width: `${
                          data.topAssets.length ? (a.count / Math.max(...data.topAssets.map((x) => x.count))) * 100 : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <p className="label-caps">{t("profileCard.tradeSummary")}</p>
          <div className="mt-3">
            <div className="mb-1.5 flex items-center justify-between text-[12.5px] font-bold text-text-1">
              <span>{t("profileCard.wins")} · {wins}</span>
              <span>{t("profileCard.losses")} · {losses}</span>
            </div>
            <div className="flex h-2 overflow-hidden rounded-full bg-neutral/6">
              <div className="h-full bg-pos" style={{ width: `${winShare}%` }} />
              <div className="h-full bg-neg" style={{ width: `${100 - winShare}%` }} />
            </div>
          </div>
          <div className="mt-4 space-y-2">
            {summaryRows.map((r) => (
              <div key={r.label} className="flex items-center justify-between rounded-xl bg-neutral/4 px-3.5 py-2.5 text-[12.5px]">
                <span className="font-semibold text-text-2">{r.label}</span>
                <span className={cn("num font-bold", r.c)}>{r.value}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* ── Мини-метрики ── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {mini.map((m) => (
          <Card key={m.label} className="p-4">
            <p className="label-caps !text-[9.5px]">{m.label}</p>
            <p className={cn("num mt-1.5 text-[19px] font-extrabold leading-none text-text-1", m.c)}>{m.value}</p>
          </Card>
        ))}
      </div>

      {/* ── Соцсети, промо, счета ── */}
      {(data.instagram || data.telegram || data.youtube || data.tradingview) && (
        <div>
          <div className="field-label mb-1.5">{t("admin.users.socials")}</div>
          <SocialLinks
            values={{
              instagram: data.instagram,
              telegram: data.telegram,
              youtube: data.youtube,
              tradingview: data.tradingview,
            }}
          />
        </div>
      )}

      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <div className="field-label mb-1.5">{t("admin.users.promos")}</div>
          {data.promos.length ? (
            <div className="space-y-1.5">
              {data.promos.map((p) => (
                <div key={p.code + p.activatedAt} className="flex items-center gap-2.5 rounded-lg border border-card-border px-3 py-2">
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
      </div>

      {/* ── Бан ── */}
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
