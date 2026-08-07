"use client";

import { useState } from "react";
import { Tag, Plus, Wallet, Clock3, Boxes, ChevronDown, Trash2 } from "lucide-react";
import { MarketIcon } from "@/components/MarketIcon";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Modal } from "@/components/ui/modal";
import { EmptyState } from "@/components/ui/empty";
import { cn } from "@/lib/utils";
import { useAssets, useCreateAsset, useCreateStrategy, useCreateTag, useDeleteTag, useStrategies, useTags, useUpdateTag } from "@/hooks/use-libraries";
import { useUiStore, type LibrariesTab } from "@/lib/ui-store";
import { useLang } from "@/lib/i18n";
import type { Tag as TagType } from "@/lib/types";

const TABS: { key: LibrariesTab; label: string; icon: typeof Tag }[] = [
  { key: "tags", label: "libraries.tab.tags", icon: Tag },
  { key: "assets", label: "libraries.tab.assets", icon: Wallet },
  { key: "sessions", label: "libraries.tab.sessions", icon: Clock3 },
  { key: "strategies", label: "libraries.tab.strategies", icon: Boxes },
];

const PALETTE = ["#7C6CF0", "#14B8A6", "#F59E0B", "#EF4444", "#22C55E", "#2563EB", "#EC4899", "#8B5CF6"];

export default function LibrariesPage() {
  const tab = useUiStore((s) => s.librariesTab);
  const setTab = useUiStore((s) => s.setLibrariesTab);
  const { t } = useLang();
  const tags = useTags();
  const assets = useAssets();
  const strategies = useStrategies();
  const createTag = useCreateTag();
  const updateTag = useUpdateTag();
  const deleteTag = useDeleteTag();
  const createAsset = useCreateAsset();
  const createStrategy = useCreateStrategy();

  const [editTag, setEditTag] = useState<TagType | null>(null);
  const [createTagOpen, setCreateTagOpen] = useState(false);
  const [createAssetOpen, setCreateAssetOpen] = useState(false);
  const [createStrategyOpen, setCreateStrategyOpen] = useState(false);

  return (
    <div className="space-y-5">
      <PageHeader
        title={t("page.libraries.t")}
        subtitle={t("page.libraries.s")}
        actions={
          (tab === "tags" || tab === "assets" || tab === "strategies") && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                if (tab === "tags") setCreateTagOpen(true);
                if (tab === "assets") setCreateAssetOpen(true);
                if (tab === "strategies") setCreateStrategyOpen(true);
              }}
            >
              <Plus size={15} /> {tab === "tags" ? t("libraries.newTag") : tab === "assets" ? t("libraries.addAsset") : t("libraries.newStrategy")}
            </button>
          )
        }
      />

      <div className="animate-in flex flex-wrap gap-1.5">
        {TABS.map((tabItem) => (
          <button
            key={tabItem.key}
            type="button"
            onClick={() => setTab(tabItem.key)}
            className={cn("chip", tab === tabItem.key && "active")}
          >
            <tabItem.icon size={14} /> {t(tabItem.label)}
          </button>
        ))}
      </div>

      {tab === "tags" && (
        <div className="animate-in animate-delay-1 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {tags.data?.map((t) => (
            <Card key={t.id} className="card-hover flex cursor-pointer items-center justify-between p-4" hover onClick={() => setEditTag(t)}>
              <span className="pill" style={{ background: `${t.color}1F`, color: t.color }}>
                <Tag size={12} /> {t.name}
              </span>
              <ChevronDown size={14} className="rotate-[-90deg] text-text-3" />
            </Card>
          ))}
          {tags.isSuccess && tags.data.length === 0 && (
            <div className="col-span-full">
              <EmptyState icon={<Tag size={26} />} title={t("libraries.tagsEmpty.t")} description={t("libraries.tagsEmpty.s")} />
            </div>
          )}
        </div>
      )}

      {tab === "assets" && (
        <div className="animate-in animate-delay-1 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {assets.data?.map((a) => (
            <Card key={a.id} className="card-hover flex items-center gap-3 p-4" hover>
              <MarketIcon symbol={a.name} size={40} />
              <div>
                <p className="text-[13.5px] font-extrabold text-text-1">{a.name}</p>
                <p className="text-[11.5px] text-text-3">{a.category}</p>
              </div>
            </Card>
          ))}
          {assets.isSuccess && assets.data.length === 0 && (
            <div className="col-span-full">
              <EmptyState icon={<Wallet size={26} />} title={t("libraries.assetsEmpty.t")} description={t("libraries.assetsEmpty.s")} />
            </div>
          )}
        </div>
      )}

      {tab === "sessions" && (
        <div className="animate-in animate-delay-1 grid gap-3 md:grid-cols-3">
          {[
            { r: t("libraries.session.asia.title"), t: "00:00–09:00", d: t("libraries.session.asia.desc"), c: "#7C6CF0" },
            { r: t("libraries.session.london.title"), t: "10:00–19:00", d: t("libraries.session.london.desc"), c: "#14B8A6" },
            { r: t("libraries.session.newyork.title"), t: "16:00–01:00", d: t("libraries.session.newyork.desc"), c: "#F59E0B" },
          ].map((s) => (
            <Card key={s.r} className="card-hover p-5" hover>
              <span className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl text-white" style={{ background: s.c }}>
                <Clock3 size={16} />
              </span>
              <p className="text-[14px] font-extrabold text-text-1">{s.r}</p>
              <p className="num mt-0.5 text-[12px] font-bold text-text-2">{s.t}</p>
              <p className="mt-2 text-[12.5px] leading-relaxed text-text-2">{s.d}</p>
            </Card>
          ))}
        </div>
      )}

      {tab === "strategies" && (
        <div className="animate-in animate-delay-1 grid gap-3 md:grid-cols-2">
          {strategies.data?.map((s) => (
            <Card key={s.id} className="card-hover p-5" hover>
              <div className="flex items-center gap-3">
                <span className="h-3 w-3 rounded-full" style={{ background: s.color }} />
                <p className="text-[14px] font-extrabold text-text-1">{s.name}</p>
              </div>
              {s.meta && <p className="mt-1.5 text-[12.5px] text-text-2">{s.meta}</p>}
            </Card>
          ))}
          {strategies.isSuccess && strategies.data.length === 0 && (
            <div className="col-span-full">
              <EmptyState icon={<Boxes size={26} />} title={t("libraries.strategiesEmpty.t")} description={t("libraries.strategiesEmpty.s")} />
            </div>
          )}
        </div>
      )}

      <EditTagModal
        open={Boolean(editTag) || createTagOpen}
        onClose={() => {
          setEditTag(null);
          setCreateTagOpen(false);
        }}
        onSave={(tag) => {
          if (editTag) updateTag.mutate({ id: editTag.id, ...tag });
          else createTag.mutate(tag);
          setEditTag(null);
          setCreateTagOpen(false);
        }}
        onDelete={
          editTag
            ? () => {
                deleteTag.mutate(editTag.id);
                setEditTag(null);
              }
            : undefined
        }
        initial={editTag}
      />

      <CreateAssetModal
        open={createAssetOpen}
        onClose={() => setCreateAssetOpen(false)}
        onSave={(a) => {
          createAsset.mutate(a);
          setCreateAssetOpen(false);
        }}
      />

      <CreateStrategyModal
        open={createStrategyOpen}
        onClose={() => setCreateStrategyOpen(false)}
        onSave={(s) => {
          createStrategy.mutate(s);
          setCreateStrategyOpen(false);
        }}
      />
    </div>
  );
}

function EditTagModal({
  open,
  onClose,
  onSave,
  onDelete,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (tag: { name: string; color: string }) => void;
  onDelete?: () => void;
  initial: TagType | null;
}) {
  const { t } = useLang();
  const [name, setName] = useState(initial?.name ?? "");
  const [color, setColor] = useState(initial?.color ?? PALETTE[0]);

  return (
    <Modal open={open} onClose={onClose} title={initial ? t("libraries.editTag") : t("libraries.newTag")}>
      <div className="space-y-4">
        <div>
          <label className="field-label">{t("libraries.name")}</label>
          <input className="field" value={name} onChange={(e) => setName(e.target.value)} placeholder={t("libraries.tagNamePlaceholder")} />
        </div>

        <div>
          <label className="field-label">{t("libraries.color")}</label>
          <div className="flex flex-wrap gap-2">
            {PALETTE.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={cn(
                  "h-8 w-8 rounded-full transition-transform",
                  color === c && "scale-110 ring-2 ring-[#12182B] ring-offset-2",
                )}
                style={{ background: c }}
                aria-label={`${t("libraries.color")} ${c}`}
              />
            ))}
          </div>
        </div>

        <div>
          <label className="field-label">{t("libraries.preview")}</label>
          <div className="flex items-center justify-center rounded-xl bg-bg py-4">
            <span className="pill" style={{ background: `${color}1F`, color }}>
              <Tag size={12} /> {name || t("libraries.tag")}
            </span>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          {onDelete && (
            <button type="button" className="btn btn-ghost mr-auto !text-[#F87171]" onClick={onDelete}>
              <Trash2 size={14} /> {t("ideas.delete")}
            </button>
          )}
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            {t("settings.cancel")}
          </button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={!name.trim()}
            onClick={() => onSave({ name: name.trim(), color })}
          >
            {t("settings.save")}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function CreateAssetModal({
  open,
  onClose,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (a: { symbol: string; name: string; color: string; category: string }) => void;
}) {
  const { t } = useLang();
  const [symbol, setSymbol] = useState("");
  const [name, setName] = useState("");
  const [color, setColor] = useState(PALETTE[0]);

  const submit = () => {
    onSave({ symbol: symbol.trim().toUpperCase(), name: name.trim(), color, category: "other" });
    setSymbol("");
    setName("");
  };

  return (
    <Modal open={open} onClose={onClose} title={t("libraries.addAsset")}>
      <div className="space-y-4">
        <div>
          <label className="field-label">{t("libraries.assetSymbol")}</label>
          <input className="field" value={symbol} onChange={(e) => setSymbol(e.target.value)} placeholder={t("libraries.assetSymbolPlaceholder")} />
        </div>
        <div>
          <label className="field-label">{t("libraries.name")}</label>
          <input className="field" value={name} onChange={(e) => setName(e.target.value)} placeholder={t("libraries.assetNamePlaceholder")} />
        </div>
        <div>
          <label className="field-label">{t("libraries.color")}</label>
          <div className="flex flex-wrap gap-2">
            {PALETTE.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={cn(
                  "h-8 w-8 rounded-full transition-transform",
                  color === c && "scale-110 ring-2 ring-[#12182B] ring-offset-2",
                )}
                style={{ background: c }}
                aria-label={`${t("libraries.color")} ${c}`}
              />
            ))}
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            {t("settings.cancel")}
          </button>
          <button type="button" className="btn btn-primary" disabled={!symbol.trim() || !name.trim()} onClick={submit}>
            {t("admin.promo.add")}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function CreateStrategyModal({
  open,
  onClose,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (s: { name: string; meta: string; color: string }) => void;
}) {
  const { t } = useLang();
  const [name, setName] = useState("");
  const [meta, setMeta] = useState("");
  const [color, setColor] = useState(PALETTE[1]);

  const submit = () => {
    onSave({ name: name.trim(), meta: meta.trim(), color });
    setName("");
    setMeta("");
  };

  return (
    <Modal open={open} onClose={onClose} title={t("libraries.newStrategy")}>
      <div className="space-y-4">
        <div>
          <label className="field-label">{t("libraries.name")}</label>
          <input className="field" value={name} onChange={(e) => setName(e.target.value)} placeholder={t("libraries.strategyNamePlaceholder")} />
        </div>
        <div>
          <label className="field-label">{t("libraries.strategyDescription")}</label>
          <input className="field" value={meta} onChange={(e) => setMeta(e.target.value)} placeholder={t("libraries.strategyMetaPlaceholder")} />
        </div>
        <div>
          <label className="field-label">{t("libraries.color")}</label>
          <div className="flex flex-wrap gap-2">
            {PALETTE.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={cn(
                  "h-8 w-8 rounded-full transition-transform",
                  color === c && "scale-110 ring-2 ring-[#12182B] ring-offset-2",
                )}
                style={{ background: c }}
                aria-label={`${t("libraries.color")} ${c}`}
              />
            ))}
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            {t("settings.cancel")}
          </button>
          <button type="button" className="btn btn-primary" disabled={!name.trim()} onClick={submit}>
            {t("dock.create")}
          </button>
        </div>
      </div>
    </Modal>
  );
}
