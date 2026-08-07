"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface Tab {
  title: string;
  icon: LucideIcon;
  type?: never;
}

interface Separator {
  type: "separator";
  title?: never;
  icon?: never;
}

type TabItem = Tab | Separator;

interface ExpandableTabsProps {
  tabs: TabItem[];
  className?: string;
  activeColor?: string;
  selectedIndex?: number | null;
  onChange?: (index: number | null) => void;
}

const buttonVariants = {
  initial: {
    gap: 0,
    paddingLeft: "0.5rem",
    paddingRight: "0.5rem",
  },
  animate: (isSelected: boolean) => ({
    gap: isSelected ? "0.5rem" : 0,
    paddingLeft: isSelected ? "0.9rem" : "0.5rem",
    paddingRight: isSelected ? "0.9rem" : "0.5rem",
  }),
};

const spanVariants = {
  initial: { width: 0, opacity: 0 },
  animate: { width: "auto", opacity: 1 },
  exit: { width: 0, opacity: 0 },
};

const transition = { delay: 0.1, type: "spring" as const, bounce: 0, duration: 0.55 };

function Separator() {
  return <div className="mx-0.5 h-6 w-px bg-card-border" aria-hidden="true" />;
}

export function ExpandableTabs({
  tabs,
  className,
  activeColor = "var(--text-1)",
  selectedIndex,
  onChange,
}: ExpandableTabsProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) onChange?.(null);
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [onChange]);

  const handleSelect = (index: number) => onChange?.(index);

  return (
    <div
      ref={containerRef}
      className={cn("flex flex-wrap items-center gap-1.5 p-0.5", className)}
    >
      {tabs.map((item, index) => {
        if (item.type === "separator") return <Separator key={`sep-${index}`} />;
        const isSelected = selectedIndex === index;
        const Icon = item.icon;
        return (
          <motion.button
            key={item.title}
            variants={buttonVariants}
            animate="animate"
            custom={isSelected}
            onClick={() => handleSelect(index)}
            className="relative flex h-9 cursor-pointer items-center rounded-xl text-[12.5px] font-semibold transition-colors duration-200"
            style={{ color: isSelected ? activeColor : "var(--text-2)" }}
          >
            {isSelected && (
              <motion.span
                layoutId="topnav-active-pill"
                className="absolute inset-0 rounded-xl bg-card"
                style={{ boxShadow: "var(--shadow-card)" }}
                transition={{ type: "spring", stiffness: 350, damping: 30 }}
              />
            )}
            <span className="relative z-10">
              <Icon size={16} strokeWidth={isSelected ? 2.2 : 1.8} />
            </span>
            <AnimatePresence initial={false}>
              {isSelected && (
                <motion.span
                  variants={spanVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={transition}
                  className="relative z-10 overflow-hidden whitespace-nowrap"
                >
                  {item.title}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        );
      })}
    </div>
  );
}
