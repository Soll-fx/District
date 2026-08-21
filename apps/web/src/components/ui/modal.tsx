"use client";

import { X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useLang } from "@/lib/i18n";

const MAX_W = {
  md: "max-w-[420px]",
  lg: "max-w-[560px]",
  xl: "max-w-[920px]",
} as const;

export function Modal({
  open,
  onClose,
  title,
  children,
  wide,
  size,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  wide?: boolean;
  size?: keyof typeof MAX_W;
}) {
  const { t } = useLang();
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#12182B]/45 backdrop-blur-[2px]"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.32, 0.72, 0, 1] }}
            className={`fixed left-1/2 top-1/2 z-50 flex max-h-[min(74dvh,600px)] w-[calc(100vw-32px)] -translate-x-1/2 -translate-y-1/2 flex-col rounded-2xl bg-card p-5 shadow-lg ${
              size === "xl" ? MAX_W.xl : wide ? MAX_W.lg : MAX_W.md
            }`}
          >
            <div className="mb-4 flex shrink-0 items-center justify-between">
              <h3 className="text-[16px] font-extrabold tracking-tight text-text-1">{title}</h3>
              <button
                type="button"
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-bg text-text-2 transition-colors hover:text-text-1"
                aria-label={t("common.close")}
              >
                <X size={15} />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
