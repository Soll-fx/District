"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, Check, Paperclip, Pencil, Plus, Trash2, X } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { AdminTabs } from "@/components/ui/admin-tabs";
import { Card } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { EmptyState } from "@/components/ui/empty";
import { useLang } from "@/lib/i18n";
import { useAuth } from "@/lib/auth-store";
import { API_URL } from "@/lib/api";
import { ideaDateLabel } from "@/lib/mappers";
import { cn } from "@/lib/utils";
import {
  useCreateJournalEntry,
  useDeleteJournalEntry,
  useJournal,
  useUpdateJournalEntry,
  useUploadJournalFile,
  type AttachmentInput,
} from "@/hooks/use-journal";

function fileUrl(u: string) {
  if (u.startsWith("http")) return u;
  return API_URL.replace(/\/api$/, "") + u;
}

function fmtSize(bytes: number | null) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function AdminJournalPage() {
  const router = useRouter();
  const { t } = useLang();
  const user = useAuth((s) => s.user);

  const isAdmin = user?.role === "ADMIN";
  useEffect(() => {
    if (user && !isAdmin) router.replace("/");
  }, [user, isAdmin, router]);

  const { data: entries, isLoading } = useJournal();
  const createEntry = useCreateJournalEntry();
  const updateEntry = useUpdateJournalEntry();
  const deleteEntry = useDeleteJournalEntry();
  const upload = useUploadJournalFile();

  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [attachments, setAttachments] = useState<AttachmentInput[]>([]);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isAdmin) return null;

  const openCreate = () => {
    setEditId(null);
    setTitle("");
    setContent("");
    setAttachments([]);
    setOpen(true);
  };

  const openEdit = (e: {
    id: string;
    title: string;
    content: string;
    attachments: { url: string; fileName: string; mimeType: string | null; size: number | null }[];
  }) => {
    setEditId(e.id);
    setTitle(e.title);
    setContent(e.content);
    setAttachments(
      e.attachments.map((a) => ({
        url: a.url,
        fileName: a.fileName,
        mimeType: a.mimeType ?? undefined,
        size: a.size ?? undefined,
      })),
    );
    setOpen(true);
  };

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    files.forEach((f) =>
      upload.mutate(f, {
        onSuccess: (res) =>
          setAttachments((prev) => [
            ...prev,
            { url: res.url, fileName: res.fileName, mimeType: res.mimeType, size: res.size },
          ]),
      }),
    );
    e.target.value = "";
  };

  const handleSave = () => {
    if (!content.trim()) return;
    if (editId) {
      updateEntry.mutate(
        { id: editId, title, content, attachments },
        { onSuccess: () => closeForm() },
      );
    } else {
      createEntry.mutate(
        { title, content, attachments },
        { onSuccess: () => closeForm() },
      );
    }
  };

  const closeForm = () => {
    setOpen(false);
    setEditId(null);
    setTitle("");
    setContent("");
    setAttachments([]);
  };

  const handleDelete = (id: string) => {
    if (confirmId !== id) {
      setConfirmId(id);
      setTimeout(() => setConfirmId(null), 3000);
      return;
    }
    deleteEntry.mutate(id);
    setConfirmId(null);
  };

  const saving = createEntry.isPending || updateEntry.isPending;

  return (
    <div className="space-y-5">
      <PageHeader
        title={t("page.admin.journal.t")}
        subtitle={t("page.admin.journal.s")}
        actions={
          <button type="button" className="btn btn-primary" onClick={openCreate}>
            <Plus size={16} /> {t("admin.journal.create")}
          </button>
        }
      />

      <AdminTabs />

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="card h-40 animate-pulse" />
          ))}
        </div>
      ) : !entries?.length ? (
        <EmptyState
          icon={<BookOpen size={22} />}
          title={t("admin.journal.empty")}
          description={t("admin.journal.emptyHint")}
          action={
            <button type="button" className="btn btn-primary" onClick={openCreate}>
              <Plus size={16} /> {t("admin.journal.create")}
            </button>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {entries.map((e) => {
            const images = e.attachments.filter((a) => a.mimeType?.startsWith("image/"));
            const files = e.attachments.filter((a) => !a.mimeType?.startsWith("image/"));
            return (
              <Card key={e.id} hover className="flex flex-col p-4">
                <div className="mb-1 flex items-center gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wide text-text-3">
                    {ideaDateLabel(e.createdAt)}
                  </span>
                  <div className="ml-auto flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => openEdit(e)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-text-3 transition-all hover:bg-bg hover:text-text-1"
                      aria-label={t("admin.journal.edit")}
                      title={t("admin.journal.edit")}
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(e.id)}
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-lg transition-all",
                        confirmId === e.id
                          ? "bg-neg-bg text-neg"
                          : "text-text-3 hover:bg-neg-bg hover:text-neg",
                      )}
                      aria-label={t("admin.journal.delete")}
                      title={t("admin.journal.delete")}
                    >
                      {confirmId === e.id ? <Check size={15} /> : <Trash2 size={15} />}
                    </button>
                  </div>
                </div>

                {e.title && (
                  <h3 className="text-[14px] font-extrabold tracking-tight text-text-1">
                    {e.title}
                  </h3>
                )}

                <p className="mt-2 whitespace-pre-wrap break-words text-[13px] leading-relaxed text-text-2">
                  {e.content}
                </p>

                {(images.length > 0 || files.length > 0) && (
                  <div className="mt-3 flex flex-wrap items-start gap-2">
                    {images.map((a) => (
                      <a
                        key={a.id}
                        href={fileUrl(a.url)}
                        target="_blank"
                        rel="noreferrer"
                        title={a.fileName}
                        className="block overflow-hidden rounded-xl border border-card-border"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={fileUrl(a.url)}
                          alt={a.fileName}
                          className="h-16 w-16 object-cover transition-transform duration-200 hover:scale-110"
                        />
                      </a>
                    ))}
                    {files.map((a) => (
                      <a
                        key={a.id}
                        href={fileUrl(a.url)}
                        target="_blank"
                        rel="noreferrer"
                        className="chip"
                        title={a.fileName}
                      >
                        <Paperclip size={13} />
                        <span className="max-w-[140px] truncate">{a.fileName}</span>
                        <span className="text-text-3">{fmtSize(a.size)}</span>
                      </a>
                    ))}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      <Modal
        open={open}
        onClose={closeForm}
        title={editId ? t("admin.journal.edit") : t("admin.journal.create")}
      >
        <div className="space-y-4">
          <div>
            <label className="field-label">{t("admin.journal.titleLabel")}</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Разбор недели"
              className="field"
              autoFocus
              maxLength={200}
            />
          </div>

          <div>
            <label className="field-label">{t("admin.journal.contentLabel")}</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={t("admin.journal.contentPlaceholder")}
              className="field min-h-28 resize-y"
            />
          </div>

          <div>
            <div className="flex items-center justify-between gap-2">
              <label className="field-label">{t("admin.journal.attachmentsLabel")}</label>
              <button
                type="button"
                className="btn btn-ghost py-1.5 text-[12px]"
                onClick={() => fileInputRef.current?.click()}
                disabled={upload.isPending}
              >
                <Paperclip size={14} />
                {upload.isPending ? t("admin.journal.uploading") : t("admin.journal.attach")}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFiles}
                className="hidden"
              />
            </div>

            {attachments.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {attachments.map((a, i) => (
                  <span key={`${a.url}-${i}`} className="chip">
                    <Paperclip size={13} />
                    <span className="max-w-[140px] truncate">{a.fileName}</span>
                    <button
                      type="button"
                      onClick={() =>
                        setAttachments((prev) => prev.filter((_, idx) => idx !== i))
                      }
                      className="ml-1 text-text-3 transition-colors hover:text-neg"
                      aria-label={`remove ${a.fileName}`}
                    >
                      <X size={13} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <button type="button" className="btn btn-ghost" onClick={closeForm}>
              {t("settings.cancel")}
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSave}
              disabled={!content.trim() || saving}
            >
              {saving ? t("settings.saving") : t("admin.journal.save")}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}