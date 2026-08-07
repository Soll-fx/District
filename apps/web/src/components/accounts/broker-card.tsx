"use client";

import { useState } from "react";
import { Link2, Plug, RefreshCw, Unplug, Zap } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { useLang } from "@/lib/i18n";
import {
  useBrokerAccounts,
  useConnectBroker,
  useDisconnectBroker,
  useSyncBroker,
} from "@/hooks/use-broker";
import { cn } from "@/lib/utils";

function fmtSync(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleString();
}

export function BrokerCard() {
  const { t } = useLang();
  const accounts = useBrokerAccounts();
  const connect = useConnectBroker();
  const disconnect = useDisconnectBroker();
  const sync = useSyncBroker();

  const [modalOpen, setModalOpen] = useState(false);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);

  const account = accounts.data?.[0];
  const isBusy = connect.isPending || disconnect.isPending || sync.isPending;

  const handleSync = () => {
    setSyncMsg(null);
    sync.mutate(undefined, {
      onSuccess: (res) => {
        setSyncMsg(
          res.account
            ? `${res.synced} ${t("broker.syncedCount")}`
            : t("broker.never"),
        );
        window.setTimeout(() => setSyncMsg(null), 4000);
      },
      onError: (e: Error) => {
        setSyncMsg(e.message);
        window.setTimeout(() => setSyncMsg(null), 6000);
      },
    });
  };

  return (
    <Card className="p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-hero text-white">
            <Zap size={17} />
          </span>
          <div>
            <p className="text-[14px] font-extrabold text-text-1">{t("broker.title")}</p>
            <p className="mt-0.5 max-w-md text-[11.5px] font-medium leading-snug text-text-3">
              {t("broker.subtitle")}
            </p>
          </div>
        </div>

        {account?.connected && (
          <button
            type="button"
            className="btn btn-ghost"
            disabled={isBusy}
            onClick={handleSync}
          >
            <RefreshCw size={14} className={cn(sync.isPending && "animate-spin")} />
            {sync.isPending ? t("broker.syncing") : t("broker.sync")}
          </button>
        )}
      </div>

      {account?.connected ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-1.5 rounded-full bg-pos/15 px-2.5 py-0.5 text-[11px] font-bold text-pos">
                <span className="h-1.5 w-1.5 rounded-full bg-pos" />
                {t("broker.connected")}
              </span>
              <span className="truncate text-[13px] font-extrabold text-text-1">
                {account.login}@{account.serverName}
              </span>
            </div>
            <p className="text-[11.5px] font-semibold text-text-3">
              {t("broker.providerLabel")}: {account.apiProvider === "metapi" ? "MetaApi" : "Demo"}
            </p>
            {account.lastSyncError ? (
              <p className="text-[11.5px] font-semibold text-neg">
                {t("broker.syncError")}: {account.lastSyncError}
              </p>
            ) : null}
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-text-3">
                {t("broker.lastSync")}
              </p>
              <p className="text-[11px] font-semibold text-text-2">
                {account.lastSyncedAt ? fmtSync(account.lastSyncedAt) : t("broker.never")}
              </p>
            </div>
            <button
              type="button"
              className="btn btn-ghost"
              disabled={isBusy}
              onClick={() => disconnect.mutate(account.id)}
            >
              <Unplug size={14} /> {t("broker.disconnect")}
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-[12px] font-semibold text-text-3">
            <Link2 size={13} />
            {t("broker.disconnected")}
          </div>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setModalOpen(true)}
          >
            <Plug size={14} /> {t("broker.connect")}
          </button>
        </div>
      )}

      {syncMsg && (
        <p className="mt-3 text-[11.5px] font-semibold text-pos">{syncMsg}</p>
      )}

      <BrokerConnectModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </Card>
  );
}

function BrokerConnectModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { t } = useLang();
  const connect = useConnectBroker();
  const [login, setLogin] = useState("");
  const [server, setServer] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!login.trim() || !server.trim()) return;
    connect.mutate(
      { apiProvider: "mock", login: login.trim(), serverName: server.trim() },
      {
        onSuccess: () => {
          setLogin("");
          setServer("");
          onClose();
        },
      },
    );
  };

  return (
    <Modal open={open} onClose={onClose} title={t("broker.connect")}>
      <form className="space-y-4" onSubmit={submit}>
        <div>
          <label className="field-label">{t("broker.fieldLogin")}</label>
          <input
            className="field num"
            placeholder={t("broker.login")}
            required
            value={login}
            onChange={(e) => setLogin(e.target.value)}
          />
        </div>
        <div>
          <label className="field-label">{t("broker.fieldServer")}</label>
          <input
            className="field"
            placeholder={t("broker.server")}
            required
            value={server}
            onChange={(e) => setServer(e.target.value)}
          />
        </div>
        <p className="flex items-center gap-1.5 text-[11.5px] font-semibold text-text-3">
          <Link2 size={12} /> {t("broker.needBroker")}
        </p>
        <div className="flex justify-end gap-2">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            {t("accounts.cancel")}
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={!login.trim() || !server.trim() || connect.isPending}
          >
            <Plug size={14} /> {t("broker.connect")}
          </button>
        </div>
      </form>
    </Modal>
  );
}
