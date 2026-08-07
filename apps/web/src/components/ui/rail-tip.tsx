"use client";

import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";

type TipPos = { x: number; y: number };

export function RailTip({ children, content }: { children: React.ReactNode; content: React.ReactNode }) {
  const [pos, setPos] = useState<TipPos | null>(null);
  const idRef = useRef(0);

  const show = (e: React.MouseEvent) => {
    const r = e.currentTarget.getBoundingClientRect();
    idRef.current += 1;
    setPos({ x: r.right + 12, y: r.top + r.height / 2 });
  };

  const hide = () => {
    const id = idRef.current;
    setTimeout(() => {
      if (idRef.current === id) setPos(null);
    }, 60);
  };

  return (
    <div className="group relative" onMouseEnter={show} onMouseLeave={hide}>
      {children}
      {createPortal(
        <AnimatePresence>
          {pos && (
            <motion.div
              className="pointer-events-none fixed z-[60]"
              style={{ left: pos.x, top: pos.y, transform: "translateY(-50%)" }}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              {content}
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </div>
  );
}
