"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { ChevronRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { RailTip } from "@/components/ui/rail-tip";

export interface GradientMenuItem {
  href: string;
  label: string;
  icon: LucideIcon;
  from: string;
  to: string;
}

const SIZE = 44;
const PITCH = SIZE + 8;

export function GradientMenu({ items }: { items: GradientMenuItem[] }) {
  const pathname = usePathname();
  const activeIndex = Math.max(
    0,
    items.findIndex((i) => i.href === pathname),
  );
  const [index, setIndex] = useState(activeIndex);

  useEffect(() => {
    setIndex(activeIndex);
  }, [activeIndex]);

  const current = items[index] ?? items[activeIndex];

  return (
    <ul
      className="relative flex flex-col items-center gap-2"
      onMouseLeave={() => setIndex(activeIndex)}
    >
      {/* живой фон — неоновый индикатор перетекает между кнопками */}
      {current && (
        <div
          className="pointer-events-none absolute left-0 z-0 h-11 w-11 rounded-full transition-all duration-200 ease-out"
          style={{
            top: `${index * PITCH}px`,
            background: `linear-gradient(45deg, ${current.from}, ${current.to})`,
            boxShadow: `0 0 22px ${current.to}, 0 0 46px ${current.from}`,
          }}
        />
      )}

      {items.map((item, idx) => {
        const Icon = item.icon;
        const lit = idx === index;
        return (
          <li key={item.href} className="relative z-10">
            <RailTip
              content={
                <div className="flex items-center gap-2.5 whitespace-nowrap rounded-xl border border-card-border bg-card/90 py-2 pl-2.5 pr-3.5 shadow-dock backdrop-blur-xl">
                  <span
                    className="flex h-7 w-7 items-center justify-center rounded-full"
                    style={{ background: `linear-gradient(45deg, ${item.from}, ${item.to})` }}
                  >
                    <Icon size={13} strokeWidth={2.4} className="text-white" />
                  </span>
                  <span className="text-[12px] font-extrabold text-text-1">{item.label}</span>
                  <ChevronRight size={14} className="text-text-2" />
                </div>
              }
            >
              <Link
                href={item.href}
                aria-label={item.label}
                onMouseEnter={() => setIndex(idx)}
                className="relative flex h-11 w-11 items-center justify-center rounded-full"
              >
                <Icon
                  size={19}
                  strokeWidth={lit ? 2.4 : 1.8}
                  className={cn(
                    "transition-all duration-300",
                    lit
                      ? "text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.85)]"
                      : "text-text-1",
                  )}
                />
              </Link>
            </RailTip>
          </li>
        );
      })}
    </ul>
  );
}
