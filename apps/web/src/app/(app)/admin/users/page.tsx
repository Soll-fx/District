"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Users as UsersIcon, Globe, CalendarDays, AtSign, Wallet } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { EmptyState } from "@/components/ui/empty";
import { useLang } from "@/lib/i18n";
import { useAuth } from "@/lib/auth-store";
import { useAdminUser, useAdminUsers } from "@/hooks/use-admin-users";
import { ideaDateLabel } from "@/lib/mappers";
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
  const [q, setQ] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
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

  return (
    <div className="space-y-5">
      <PageHeader
        title={t("page.admin.users.t")}
        subtitle={t("page.admin.users.s")}
        actions={
          <span className="pill pill-violet">
            <UsersIcon size={13} /> {filtered.length}
          </span>
        }
      />

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
          {filtered.map((u) => (
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
                <span className="block truncate text-[14px] font-bold text-text-1">{u.name || "—"}</span>
                <span className="block truncate text-[12px] font-medium text-text-3">{u.email}</span>
              </span>

              {u.role === "ADMIN" && <span className="pill pill-violet">ADMIN</span>}

              <span className={cn("pill", u.promoCode ? "pill-pos" : "pill-neutral")}>
                {u.promoCode ? u.promoCode : t("admin.users.noPromo")}
              </span>

              <span className="ml-auto text-[12px] font-semibold text-text-3">{ideaDateLabel(u.createdAt)}</span>
            </button>
          ))}
        </Card>
      )}

      <Modal open={!!openId} onClose={() => setOpenId(null)} title={t("admin.users.card")}>
        {profile.isLoading || !profile.data ? (
          <div className="h-48 animate-pulse rounded-xl bg-card-border/50" />
        ) : (
          <div className="space-y-5">
            <div className="flex items-center gap-4">
              {profile.data.avatarUrl ? (
                <img src={profile.data.avatarUrl} alt="" className="h-16 w-16 rounded-full object-cover" />
              ) : (
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-violet to-teal text-[20px] font-extrabold text-white">
                  {(profile.data.name ?? profile.data.email)[0].toUpperCase()}
                </span>
              )}
              <div className="min-w-0">
                <div className="truncate text-[16px] font-extrabold text-text-1">{profile.data.name || "—"}</div>
                <div className="truncate text-[13px] font-medium text-text-3">{profile.data.email}</div>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {profile.data.role === "ADMIN" && <span className="pill pill-violet">ADMIN</span>}
                  {profile.data.twoFactorEnabled && <span className="pill pill-neutral">2FA</span>}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              <InfoRow icon={<CalendarDays size={14} />} label={t("admin.users.joined")} value={ideaDateLabel(profile.data.createdAt)} />
              <InfoRow icon={<Globe size={14} />} label={t("admin.users.locale")} value={`${profile.data.locale} · ${profile.data.timezone}`} />
            </div>

            {(profile.data.instagram || profile.data.telegram || profile.data.youtube || profile.data.tradingview) && (
              <div>
                <div className="field-label mb-1.5">{t("admin.users.socials")}</div>
                <div className="flex flex-wrap gap-1.5">
                  {(["instagram", "telegram", "youtube", "tradingview"] as const).map((k) =>
                    profile.data?.[k] ? (
                      <span key={k} className="pill pill-neutral">
                        <AtSign size={11} /> {profile.data[k]}
                      </span>
                    ) : null,
                  )}
                </div>
              </div>
            )}

            <div>
              <div className="field-label mb-1.5">{t("admin.users.promos")}</div>
              {profile.data.promos.length ? (
                <div className="space-y-1.5">
                  {profile.data.promos.map((p) => (
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

            {!!profile.data.accounts.length && (
              <div>
                <div className="field-label mb-1.5">{t("admin.users.accounts")}</div>
                <div className="space-y-1.5">
                  {profile.data.accounts.map((a) => (
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
        )}
      </Modal>
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
