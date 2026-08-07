"use client";

import { useState } from "react";
import { Wallet, Plus, Pencil, Trash2, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Modal } from "@/components/ui/modal";
import { EmptyState } from "@/components/ui/empty";
import { cn, pluralRu } from "@/lib/utils";
import { useLang } from "@/lib/i18n";
import { BrokerCard } from "@/components/accounts/broker-card";
import {
  useAccounts,
  useCreateAccount,
  useDeleteAccount,
  useUpdateAccount,
  type AccountInput,
} from "@/hooks/use-accounts";

const CURRENCIES = ["USD", "EUR", "RUB"];

const fmt = (v: number) =>
  new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 2 }).format(v);

export default function AccountsPage() {
  const { t } = useLang();
  const accounts = useAccounts();
  const create = useCreateAccount();
  const update = useUpdateAccount();
  const remove = useDeleteAccount();
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<AccountInput & { id?: string } | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const openCreate = () => {
    setEditing(null);
    setEditorOpen(true);
  };

  const openEdit = (acc: { id: string; name: string; type: string; balance: number; currency: string }) => {
    setEditing({ id: acc.id, name: acc.name, type: acc.type, balance: acc.balance, currency: acc.currency });
    setEditorOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirmId !== id) {
      setConfirmId(id);
      window.setTimeout(() => setConfirmId((cur) => (cur === id ? null : cur)), 3000);
      return;
    }
    setConfirmId(null);
    remove.mutate(id);
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title={t("page.accounts.t")}
        subtitle={t("page.accounts.s")}
        actions={
          <button type="button" className="btn btn-primary" onClick={openCreate}>
            <Plus size={15} /> {t("accounts.add")}
          </button>
        }
      />

      <BrokerCard />

      {accounts.isSuccess && accounts.data.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Wallet size={26} />}
            title={t("accounts.empty.t")}
            description={t("accounts.empty.s")}
          />
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {accounts.data?.map((acc) => (
            <Card key={acc.id} className="animate-in group flex flex-col gap-3 p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-hero text-white">
                    <Wallet size={17} />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-[14px] font-extrabold text-text-1">{acc.name}</p>
                    <p className="text-[11.5px] font-semibold text-text-3">
                      {acc.stats?.trades ?? acc._count?.trades ?? 0}{" "}
                      {pluralRu(
                        acc.stats?.trades ?? acc._count?.trades ?? 0,
                        t("accounts.trade1"),
                        t("accounts.trade2_4"),
                        t("accounts.trades"),
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
                  <button
                    type="button"
                    onClick={() => openEdit(acc)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-text-3 transition-colors hover:bg-bg hover:text-text-1"
                    aria-label={t("accounts.edit")}
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(acc.id)}
                    className={cn(
                      "flex h-7 w-7 items-center justify-center rounded-lg transition-colors",
                      confirmId === acc.id
                        ? "bg-neg/15 text-neg"
                        : "text-text-3 hover:bg-bg hover:text-neg",
                    )}
                    aria-label={t("accounts.delete")}
                    title={confirmId === acc.id ? t("accounts.deleteConfirm") : t("accounts.delete")}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
              <div className="flex items-end justify-between gap-2">
                <p className="shrink-0 text-[11.5px] font-semibold text-text-3">{t("accounts.balance")}</p>
                <p className="num min-w-0 text-right text-[17px] font-extrabold text-text-1">
                  {fmt(acc.currentBalance ?? acc.balance)}{" "}
                  <span className="text-[12px] font-bold text-text-3">{acc.currency}</span>
                </p>
              </div>
              <div className="mt-auto grid grid-cols-4 gap-1 border-t border-card-border pt-3">
                <div className="min-w-0">
                  <p className="truncate text-[10px] font-bold uppercase tracking-[0.12em] text-text-3">
                    {t("dashboard.kpi.winrate")}
                  </p>
                  <p className="num mt-0.5 text-[14px] font-extrabold text-text-1">
                    {acc.stats?.winRate ?? 0}%
                  </p>
                </div>
                <div className="min-w-0">
                  <p className="truncate text-[10px] font-bold uppercase tracking-[0.12em] text-text-3">
                    {t("accounts.wins")}
                  </p>
                  <p className="num mt-0.5 text-[14px] font-extrabold text-pos">
                    {acc.stats?.wins ?? 0}
                  </p>
                </div>
                <div className="min-w-0">
                  <p className="truncate text-[10px] font-bold uppercase tracking-[0.12em] text-text-3">
                    {t("accounts.losses")}
                  </p>
                  <p className="num mt-0.5 text-[14px] font-extrabold text-neg">
                    {acc.stats?.losses ?? 0}
                  </p>
                </div>
                <div className="min-w-0">
                  <p className="truncate text-[10px] font-bold uppercase tracking-[0.12em] text-text-3">
                    {t("accounts.direction")}
                  </p>
                  <p className="num mt-0.5 text-[14px] font-extrabold text-text-1">
                    {acc.stats?.longs ?? 0} / {acc.stats?.shorts ?? 0}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <AccountEditorModal
        open={editorOpen}
        editing={editing}
        onClose={() => setEditorOpen(false)}
        onSave={(input) => {
          if (editing?.id) {
            update.mutate({ id: editing.id, ...input }, { onSuccess: () => setEditorOpen(false) });
          } else {
            create.mutate(input, { onSuccess: () => setEditorOpen(false) });
          }
        }}
      />
    </div>
  );
}

function AccountEditorModal({
  open,
  editing,
  onClose,
  onSave,
}: {
  open: boolean;
  editing: AccountInput & { id?: string } | null;
  onClose: () => void;
  onSave: (input: AccountInput) => void;
}) {
  const { t } = useLang();
  const [name, setName] = useState(editing?.name ?? "");
  const [balance, setBalance] = useState(
    editing?.balance != null ? String(editing.balance) : "",
  );
  const [currency, setCurrency] = useState(editing?.currency ?? CURRENCIES[0]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const input: AccountInput = {
      name: name.trim(),
      balance: balance.trim() === "" ? undefined : Number(balance.replace(",", ".")),
      currency,
    };
    onSave(input);
  };

  return (
    <Modal open={open} onClose={onClose} title={editing ? t("accounts.titleEdit") : t("accounts.titleNew")}>
      <form className="space-y-4" onSubmit={submit}>
        <div>
          <label className="field-label">{t("accounts.fieldName")}</label>
          <input
            className="field"
            placeholder={t("accounts.namePlaceholder")}
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div>
          <label className="field-label">{t("accounts.fieldCurrency")}</label>
          <select className="field" value={currency} onChange={(e) => setCurrency(e.target.value)}>
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="field-label">{t("accounts.fieldBalance")}</label>
          <input
            className="field num"
            placeholder={t("accounts.balancePlaceholder")}
            value={balance}
            onChange={(e) => setBalance(e.target.value)}
          />
        </div>
        <div className="flex justify-end gap-2">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            {t("accounts.cancel")}
          </button>
          <button type="submit" className="btn btn-primary" disabled={!name.trim()}>
            {editing ? t("accounts.save") : t("accounts.create")}
          </button>
        </div>
      </form>
    </Modal>
  );
}
