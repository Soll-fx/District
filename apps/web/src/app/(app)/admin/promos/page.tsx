"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Ticket, Trash2, Check } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { EmptyState } from "@/components/ui/empty";
import { useLang } from "@/lib/i18n";
import { useAuth } from "@/lib/auth-store";
import { useCreatePromo, useDeletePromo, usePromos, useUpdatePromo } from "@/hooks/use-promos";
import { ideaDateLabel } from "@/lib/mappers";
import { cn } from "@/lib/utils";

export default function AdminPromosPage() {
  const router = useRouter();
  const { t } = useLang();
  const user = useAuth((s) => s.user);

  const isAdmin = user?.role === "ADMIN";
  useEffect(() => {
    if (user && !isAdmin) router.replace("/");
  }, [user, isAdmin, router]);

  const { data: promos, isLoading } = usePromos();
  const createPromo = useCreatePromo();
  const updatePromo = useUpdatePromo();
  const deletePromo = useDeletePromo();

  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [days, setDays] = useState(30);
  const [copied, setCopied] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  if (!isAdmin) return null;

  const handleCreate = () => {
    if (!code.trim() || createPromo.isPending) return;
    createPromo.mutate(
      { code: code.trim().toUpperCase(), durationDays: days },
      {
        onSuccess: () => {
          setCode("");
          setDays(30);
          setOpen(false);
        },
      },
    );
  };

  const handleCopy = (value: string) => {
    navigator.clipboard?.writeText(value).catch(() => {});
    setCopied(value);
    setTimeout(() => setCopied(null), 1200);
  };

  const handleDelete = (id: string) => {
    if (confirmId !== id) {
      setConfirmId(id);
      setTimeout(() => setConfirmId(null), 3000);
      return;
    }
    deletePromo.mutate(id);
    setConfirmId(null);
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title={t("page.admin.promos.t")}
        subtitle={t("page.admin.promos.s")}
        actions={
          <button type="button" className="btn btn-primary" onClick={() => setOpen(true)}>
            <Plus size={16} /> {t("admin.promo.create")}
          </button>
        }
      />

      {isLoading ? (
        <div className="grid gap-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="card h-16 animate-pulse" />
          ))}
        </div>
      ) : !promos?.length ? (
        <EmptyState
          icon={<Ticket size={22} />}
          title={t("admin.promo.empty")}
          description={t("admin.promo.emptyHint")}
          action={
            <button type="button" className="btn btn-primary" onClick={() => setOpen(true)}>
              <Plus size={16} /> {t("admin.promo.create")}
            </button>
          }
        />
      ) : (
        <Card className="divide-y divide-card-border overflow-hidden">
          {promos.map((p) => (
            <div key={p.id} className="flex flex-wrap items-center gap-3 px-4 py-3.5">
              <button
                type="button"
                onClick={() => handleCopy(p.code)}
                className="font-mono text-[13.5px] font-extrabold tracking-wide text-text-1 transition-colors hover:text-violet"
                title={t("admin.promo.copy")}
              >
                {p.code}
              </button>
              {copied === p.code && <span className="text-[11px] font-bold text-pos"><Check size={12} /></span>}

              <span className={cn("pill", p.isActive ? "pill-pos" : "pill-neutral")}>
                {p.isActive ? t("admin.promo.active") : t("admin.promo.inactive")}
              </span>

              <span className="text-[12px] font-semibold text-text-2">
                {p.durationDays} {t("admin.promo.days")}
              </span>

              <span className="text-[12px] font-semibold text-text-3">
                {ideaDateLabel(p.createdAt)}
              </span>

              <span className="ml-auto flex items-center gap-1.5">
                <span className="pill pill-violet">
                  {p.userCount} {t("admin.promo.users")}
                </span>

                <button
                  type="button"
                  onClick={() => updatePromo.mutate({ id: p.id, isActive: !p.isActive })}
                  className={cn(
                    "pill cursor-pointer transition-all",
                    p.isActive ? "pill-neutral hover:pill-neg" : "pill-pos",
                  )}
                  disabled={updatePromo.isPending}
                >
                  {p.isActive ? t("admin.promo.disable") : t("admin.promo.enable")}
                </button>

                <button
                  type="button"
                  onClick={() => handleDelete(p.id)}
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-lg transition-all",
                    confirmId === p.id
                      ? "bg-neg-bg text-neg"
                      : "text-text-3 hover:bg-neg-bg hover:text-neg",
                  )}
                  aria-label={t("admin.promo.delete")}
                >
                  {confirmId === p.id ? <Check size={15} /> : <Trash2 size={15} />}
                </button>
              </span>
            </div>
          ))}
        </Card>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={t("admin.promo.create")}>
        <div className="space-y-4">
          <div>
            <label className="field-label">{t("admin.promo.codeLabel")}</label>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="SOLLO30"
              className="field font-mono uppercase"
              autoFocus
              maxLength={32}
            />
          </div>
          <div>
            <label className="field-label">{t("admin.promo.daysLabel")}</label>
            <input
              type="number"
              value={days}
              onChange={(e) => setDays(Math.max(1, Number(e.target.value) || 1))}
              min={1}
              max={365}
              className="field"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>
              {t("settings.cancel")}
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleCreate}
              disabled={!code.trim() || createPromo.isPending}
            >
              {createPromo.isPending ? t("settings.saving") : t("admin.promo.add")}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
