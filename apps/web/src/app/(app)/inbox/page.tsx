"use client";

import { useState } from "react";
import { MessageSquare, Send, Search, LifeBuoy, Trash2, Paperclip, X, ImagePlus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Modal } from "@/components/ui/modal";
import { EmptyState } from "@/components/ui/empty";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-store";
import { timeLabel } from "@/lib/mappers";
import { compressImageFile } from "@/lib/image";
import {
  useAddMessage,
  useCreateTicket,
  useDeleteTicket,
  useTicket,
  useTickets,
} from "@/hooks/use-inbox";
import { useLang } from "@/lib/i18n";
import type { InboxTicket } from "@/lib/types";

const STATUS_META: Record<InboxTicket["status"], { labelKey: string; cls: string }> = {
  OPEN: { labelKey: "inbox.status.open", cls: "pill-neg" },
  WAITING: { labelKey: "inbox.status.waiting", cls: "pill-orange" },
  CLOSED: { labelKey: "inbox.status.closed", cls: "pill-pos" },
};

const CATEGORIES = ["Техподдержка", "Биллинг", "Другое"];

const CATEGORY_KEY: Record<string, string> = {
  "Техподдержка": "inbox.categories.support",
  "Биллинг": "inbox.categories.billing",
  "Другое": "inbox.categories.other",
};

export default function InboxPage() {
  const me = useAuth((s) => s.user);
  const { t } = useLang();
  const tickets = useTickets();
  const [activeId, setActiveId] = useState<string | null>(null);
  const active = useTicket(activeId);
  const addMessage = useAddMessage();
  const createTicket = useCreateTicket();
  const deleteTicket = useDeleteTicket();
  const [draft, setDraft] = useState("");
  const [draftImage, setDraftImage] = useState<string | null>(null);
  const [newOpen, setNewOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const send = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeId || (!draft.trim() && !draftImage)) return;
    addMessage.mutate({ id: activeId, text: draft.trim(), imageUrl: draftImage });
    setDraft("");
    setDraftImage(null);
  };

  const handleDelete = () => {
    if (!activeId) return;
    if (!confirmDelete) {
      setConfirmDelete(true);
      window.setTimeout(() => setConfirmDelete(false), 3000);
      return;
    }
    setConfirmDelete(false);
    deleteTicket.mutate({ id: activeId }, { onSuccess: () => setActiveId(null) });
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title={t("page.inbox.t")}
        subtitle={t("page.inbox.s")}
        actions={
          <button type="button" className="btn btn-primary" onClick={() => setNewOpen(true)}>
            <LifeBuoy size={15} /> {t("inbox.newTicket")}
          </button>
        }
      />

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Список тикетов */}
        <Card className="animate-in overflow-hidden">
          <div className="border-b border-card-border p-3">
            <div className="relative">
              <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-3" />
              <input className="field !py-2 !pl-9" placeholder={t("inbox.searchPlaceholder")} />
            </div>
          </div>
          <div className="max-h-[520px] overflow-y-auto">
            {tickets.data?.map((tk) => {
              const status = STATUS_META[tk.status];
              const preview = tk.messages[0]?.text ?? "";
              return (
                <button
                  key={tk.id}
                  type="button"
                  onClick={() => setActiveId(tk.id)}
                  className={cn(
                    "block w-full border-b border-card-border p-4 text-left transition-colors last:border-0",
                    activeId === tk.id ? "bg-bg" : "hover:bg-bg/60",
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-[13px] font-extrabold text-text-1">{tk.subject}</p>
                    <span className="shrink-0 text-[11px] font-semibold text-text-3">{timeLabel(tk.updatedAt)}</span>
                  </div>
                  <div className="mt-0.5 flex items-center gap-2">
                    <span className={cn("pill !px-2 !py-0.5 text-[9.5px]", status.cls)}>{t(status.labelKey)}</span>
                    <span className="text-[11px] font-semibold text-text-3">{tk.category}</span>
                  </div>
                  {preview && <p className="mt-1.5 truncate text-[12px] text-text-2">{preview}</p>}
                </button>
              );
            })}
            {tickets.isSuccess && tickets.data.length === 0 && (
              <div className="p-4">
                <EmptyState
                  icon={<MessageSquare size={26} />}
                  title={t("inbox.empty.t")}
                  description={t("inbox.empty.s")}
                />
              </div>
            )}
          </div>
        </Card>

        {/* Диалог */}
        <Card className="animate-in animate-delay-1 flex flex-col overflow-hidden lg:col-span-2">
          {active.data ? (
            <>
              <div className="flex items-center justify-between border-b border-card-border p-4">
                <div className="min-w-0">
                  <p className="truncate text-[14px] font-extrabold text-text-1">{active.data.subject}</p>
                  <p className="mt-0.5 text-[11.5px] font-semibold text-text-3">
                    {active.data.category} · {t("inbox.updated")} {timeLabel(active.data.updatedAt)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleDelete}
                  title={confirmDelete ? t("inbox.deleteConfirm") : t("inbox.deleteTicket")}
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors",
                    confirmDelete ? "bg-neg/15 text-neg" : "text-text-3 hover:bg-bg hover:text-neg",
                  )}
                >
                  <Trash2 size={15} />
                </button>
              </div>

              <div className="flex-1 space-y-3 p-4">
                {active.data.messages.map((m) => {
                  const mine = m.authorId === me?.id;
                  return (
                    <div key={m.id} className={cn("flex", mine ? "justify-start" : "justify-end")}>
                      <div
                        className={cn(
                          "max-w-[75%] rounded-2xl px-4 py-2.5 text-[13px] leading-relaxed",
                          mine ? "rounded-bl-md bg-bg text-text-1" : "rounded-br-md bg-hero text-white",
                        )}
                      >
                        {m.imageUrl && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={m.imageUrl}
                            alt={t("inbox.attachAlt")}
                            className="mb-2 max-h-[260px] w-full rounded-xl object-cover"
                          />
                        )}
                        {m.text && <p>{m.text}</p>}
                        <p className={cn("num mt-1 text-[10.5px]", mine ? "text-text-3" : "text-white/50")}>
                          {timeLabel(m.createdAt)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <form className="border-t border-card-border p-3" onSubmit={send}>
                {draftImage && (
                  <div className="mb-2 flex items-center gap-2">
                    <div className="relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={draftImage} alt={t("inbox.screenshotAlt")} className="h-16 w-24 rounded-lg object-cover" />
                      <button
                        type="button"
                        onClick={() => setDraftImage(null)}
                        className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-neg text-white shadow"
                        aria-label={t("inbox.removeAttachment")}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <label className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-xl bg-bg text-text-3 transition-colors hover:text-text-1">
                    <Paperclip size={15} />
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          compressImageFile(file).then(setDraftImage).catch(() => setDraftImage(null));
                        }
                        e.target.value = "";
                      }}
                    />
                  </label>
                  <input
                    className="field"
                    placeholder={t("inbox.messagePlaceholder")}
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                  />
                  <button
                    type="submit"
                    className="btn btn-primary !px-3"
                    aria-label={t("inbox.send")}
                    disabled={!draft.trim() && !draftImage}
                  >
                    <Send size={15} />
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center py-16">
              <MessageSquare size={30} className="mb-3 text-text-3" />
              <p className="text-[14px] font-extrabold text-text-1">{t("inbox.selectTicket")}</p>
              <p className="mt-1 text-[12.5px] text-text-2">{t("inbox.selectHint")}</p>
            </div>
          )}
        </Card>
      </div>

      <NewTicketModal
        open={newOpen}
        onClose={() => setNewOpen(false)}
        onCreate={(input) => {
          createTicket.mutate(input, {
            onSuccess: (tk) => {
              setNewOpen(false);
              setActiveId(tk.id);
            },
          });
        }}
      />
    </div>
  );
}

function NewTicketModal({
  open,
  onClose,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (input: { subject: string; category: string; text: string; imageUrl?: string | null }) => void;
}) {
  const { t } = useLang();
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [text, setText] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const submit = () => {
    onCreate({ subject: subject.trim(), category, text: text.trim(), imageUrl });
    setSubject("");
    setText("");
    setImageUrl(null);
  };

  return (
    <Modal open={open} onClose={onClose} title={t("inbox.newTicket")}>
      <div className="space-y-4">
        <div>
          <label className="field-label">{t("inbox.subject")}</label>
          <input className="field" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder={t("inbox.subjectPlaceholder")} />
        </div>
        <div>
          <label className="field-label">{t("inbox.category")}</label>
          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                className={cn("chip", category === c && "active")}
              >
                {t(CATEGORY_KEY[c])}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="field-label">{t("inbox.message")}</label>
          <textarea className="field min-h-[110px] resize-none" value={text} onChange={(e) => setText(e.target.value)} placeholder={t("inbox.describeProblem")} />
        </div>
        <div>
          <label className="field-label">{t("inbox.screenshotOptional")}</label>
          {imageUrl ? (
            <div className="relative inline-block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imageUrl} alt={t("inbox.screenshotAlt")} className="max-h-[180px] rounded-xl object-cover" />
              <button
                type="button"
                onClick={() => setImageUrl(null)}
                className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-neg text-white shadow"
                aria-label={t("inbox.removeScreenshot")}
              >
                <X size={13} />
              </button>
            </div>
          ) : (
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-card-border bg-bg px-4 py-6 text-[12.5px] font-semibold text-text-3 transition-colors hover:text-text-1">
              <ImagePlus size={16} /> {t("inbox.attachImage")}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    compressImageFile(file).then(setImageUrl).catch(() => setImageUrl(null));
                  }
                  e.target.value = "";
                }}
              />
            </label>
          )}
        </div>
        <div className="flex justify-end gap-2">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            {t("inbox.cancel")}
          </button>
          <button type="button" className="btn btn-primary" disabled={!subject.trim() || !text.trim()} onClick={submit}>
            {t("inbox.create")}
          </button>
        </div>
      </div>
    </Modal>
  );
}
