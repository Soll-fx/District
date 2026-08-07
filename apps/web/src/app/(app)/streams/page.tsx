"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { Download, FileText, Loader2, Plus, Radio, Trash2, X, Upload, Link as LinkIcon } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty";
import { useLang } from "@/lib/i18n";
import { useAuth } from "@/lib/auth-store";
import { API_URL } from "@/lib/api";
import {
  useCreateStream,
  useDeleteStream,
  useStreams,
  useToggleReaction,
  useUploadStreamFile,
} from "@/hooks/use-streams";
import { ideaDateLabel } from "@/lib/mappers";
import type { Stream } from "@/lib/types";
import { cn } from "@/lib/utils";

const STREAM_TYPES = ["YOUTUBE", "VIMEO", "GOOGLE_DRIVE", "UPLOAD"] as const;
const API_BASE = API_URL.replace(/\/api$/, "");

function toAbsolute(url: string): string {
  return url.startsWith("http") ? url : `${API_BASE}${url}`;
}

function getEmbedUrl(url: string, type: Stream["type"]): string {
  if (type === "YOUTUBE" || (!type && url.includes("youtube"))) {
    const m = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]+)/);
    if (m) return `https://www.youtube-nocookie.com/embed/${m[1]}?rel=0&modestbranding=1&iv_load_policy=3`;
  }
  if (type === "VIMEO") {
    const m = url.match(/vimeo\.com\/(\d+)/);
    if (m) return `https://player.vimeo.com/video/${m[1]}`;
  }
  if (type === "GOOGLE_DRIVE") {
    const m = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (m) return `https://drive.google.com/file/d/${m[1]}/preview`;
  }
  return url;
}

function VideoPlayer({
  url,
  type,
  fileName,
  mimeType,
}: {
  url: string;
  type: Stream["type"];
  fileName?: string | null;
  mimeType?: string | null;
}) {
  const { t } = useLang();
  const embedUrl = getEmbedUrl(url, type);
  if (type === "UPLOAD") {
    const src = toAbsolute(url);
    if (mimeType && !mimeType.startsWith("video/")) {
      return (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-bg p-4 text-center">
          <FileText size={30} className="shrink-0 text-text-3" />
          <p className="max-w-[90%] truncate text-[12.5px] font-semibold text-text-1">
            {fileName ?? t("streams.file")}
          </p>
          <a
            href={src}
            download={fileName ?? undefined}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary"
          >
            <Download size={14} /> {t("streams.download")}
          </a>
        </div>
      );
    }
    return (
      <video
        src={src}
        className="absolute inset-0 h-full w-full"
        controls
        playsInline
        preload="metadata"
        onContextMenu={(e) => e.preventDefault()}
      />
    );
  }
  return (
    <>
      <iframe
        src={embedUrl}
        className="absolute inset-0 h-full w-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        loading="lazy"
        referrerPolicy="origin"
      />
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute bottom-2 right-2 z-10 rounded-lg bg-black/60 px-2 py-1 text-[10px] font-medium text-white/80 backdrop-blur-sm transition-colors hover:text-white"
      >
        ↗ {url.includes("youtube") ? "YouTube" : url.includes("vimeo") ? "Vimeo" : "Open"}
      </a>
    </>
  );
}

export default function StreamsPage() {
  const { t } = useLang();
  const user = useAuth((s) => s.user);
  const isAdmin = user?.role === "ADMIN";

  const { data: streams, isLoading } = useStreams();
  const createStream = useCreateStream();
  const deleteStream = useDeleteStream();
  const react = useToggleReaction();
  const upload = useUploadStreamFile();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showForm, setShowForm] = useState(false);
  const [mode, setMode] = useState<"link" | "upload">("link");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState("");
  const [videoType, setVideoType] = useState<Stream["type"]>("YOUTUBE");
  const [fileName, setFileName] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string | null>(null);

  const switchMode = (m: "link" | "upload") => {
    setMode(m);
    setUrl("");
    setFileName(null);
    setMimeType(null);
    setVideoType("YOUTUBE");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUrl("");
    setFileName(null);
    setMimeType(null);
    setVideoType("UPLOAD");
    upload.mutate(file, {
      onSuccess: (res) => {
        setUrl(res.url);
        setFileName(res.fileName);
        setMimeType(res.mimeType);
      },
    });
  };

  const handleSubmit = () => {
    if (!title.trim() || !url.trim() || createStream.isPending) return;
    createStream.mutate(
      {
        title: title.trim(),
        description: description.trim(),
        url: url.trim(),
        type: videoType,
        ...(videoType === "UPLOAD" && fileName ? { fileName, mimeType: mimeType ?? undefined } : {}),
      },
      {
        onSuccess: () => {
          setTitle("");
          setDescription("");
          setUrl("");
          setFileName(null);
          setMimeType(null);
          setVideoType("YOUTUBE");
          setShowForm(false);
        },
      },
    );
  };

  const canSubmit = !!title.trim() && !!url.trim();

  return (
    <div className="space-y-5">
      <PageHeader
        title={t("page.streams.t")}
        subtitle={t("page.streams.s")}
        actions={
          isAdmin ? (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                setShowForm((v) => !v);
                setMode("link");
                setUrl("");
              }}
            >
              {showForm ? <X size={16} /> : <Plus size={16} />}
              {showForm ? t("settings.cancel") : t("streams.add")}
            </button>
          ) : undefined
        }
      />

      {isAdmin && showForm && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="card space-y-3 p-5"
        >
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t("streams.title")}
            className="field"
          />
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t("streams.description")}
            className="field"
          />

          <div className="pill-control">
            {(["link", "upload"] as const).map((m) => (
              <button
                key={m}
                type="button"
                className={mode === m ? "active" : ""}
                onClick={() => switchMode(m)}
              >
                {m === "link" ? <LinkIcon size={13} className="mr-1 inline" /> : <Upload size={13} className="mr-1 inline" />}
                {m === "link" ? t("streams.link") : t("streams.upload")}
              </button>
            ))}
          </div>

          {mode === "link" ? (
            <div className="flex flex-wrap gap-2">
              <select
                value={videoType}
                onChange={(e) => setVideoType(e.target.value as Stream["type"])}
                className="field w-auto"
              >
                {STREAM_TYPES.map((st) => (
                  <option key={st} value={st}>
                    {st === "UPLOAD" ? "Other" : st[0] + st.slice(1).toLowerCase()}
                  </option>
                ))}
              </select>
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder={t("streams.url")}
                className="field flex-1"
              />
            </div>
          ) : (
            <div className="space-y-2">
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileChange}
              />
              <button
                type="button"
                className="field flex w-full cursor-pointer items-center gap-2 text-left"
                onClick={() => fileInputRef.current?.click()}
              >
                {upload.isPending ? (
                  <Loader2 size={15} className="shrink-0 animate-spin" />
                ) : (
                  <Upload size={15} className="shrink-0" />
                )}
                <span className="flex-1 truncate">
                  {upload.isPending
                    ? t("streams.uploading")
                    : fileName
                      ? `${t("streams.fileSelected")}: ${fileName}`
                      : t("streams.chooseFile")}
                </span>
              </button>
              {upload.isError && (
                <p className="text-[12px] font-semibold text-neg">{t("streams.uploadFailed")}</p>
              )}
              <p className="text-[11.5px] text-text-3">{t("streams.uploadHint")}</p>
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSubmit}
              disabled={!canSubmit || createStream.isPending}
            >
              {createStream.isPending ? t("settings.saving") : t("streams.add")}
            </button>
          </div>
        </motion.div>
      )}

      {isLoading ? (
        <div className="grid gap-5 lg:grid-cols-2">
          {[0, 1].map((i) => (
            <Card key={i} className="h-72 animate-pulse" />
          ))}
        </div>
      ) : !streams?.length ? (
        <EmptyState
          icon={<Radio size={22} />}
          title={t("streams.empty")}
          description={t("streams.emptyHint")}
          action={
            isAdmin ? (
              <button type="button" className="btn btn-primary" onClick={() => setShowForm(true)}>
                <Plus size={16} /> {t("streams.add")}
              </button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {streams.map((stream) => (
            <Card key={stream.id} hover className="overflow-hidden">
              <div className="relative aspect-video bg-black" onContextMenu={(e) => e.preventDefault()}>
                <VideoPlayer url={stream.url} type={stream.type} fileName={stream.fileName} mimeType={stream.mimeType} />
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-[15px] font-extrabold tracking-tight text-text-1">
                      {stream.title}
                    </h3>
                    {stream.description && (
                      <p className="mt-1 text-[12.5px] leading-relaxed text-text-2">
                        {stream.description}
                      </p>
                    )}
                    <p className="mt-1.5 text-[11px] font-semibold text-text-3">
                      {ideaDateLabel(stream.createdAt)}
                    </p>
                  </div>
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => deleteStream.mutate(stream.id)}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-text-3 transition-colors hover:bg-neg-bg hover:text-neg"
                      aria-label={t("streams.delete")}
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  {stream.reactions.map((r) => {
                    const active = r.mine;
                    return (
                      <button
                        key={r.emoji}
                        type="button"
                        onClick={() => react.mutate({ id: stream.id, emoji: r.emoji })}
                        className={cn(
                          "inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[14px] transition-all hover:scale-105 active:scale-95",
                          active
                            ? "bg-violet/15 ring-1 ring-violet/40"
                            : "bg-bg hover:bg-card-border/50",
                        )}
                        aria-pressed={active}
                      >
                        <span>{r.emoji}</span>
                        {r.count > 0 && (
                          <span
                            className={cn(
                              "text-[11px] font-bold",
                              active ? "text-violet" : "text-text-3",
                            )}
                          >
                            {r.count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
