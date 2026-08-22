"use client";

import { useCallback, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

// координаты центра головы в % от размера картинки (посчитаны по пикселям)
const HEAD = { x: 54.6, y: 12.2 };

export function CharacterScene({ className }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  const setVars = useCallback((x: number, y: number) => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--hx", x.toFixed(3));
    el.style.setProperty("--hy", y.toFixed(3));
  }, []);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      setVars(e.clientX / window.innerWidth - 0.5, e.clientY / window.innerHeight - 0.5);
    };
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, [setVars]);

  return (
    <div
      ref={ref}
      aria-hidden
      className={cn(
        "cp-scene relative flex h-full w-full items-center justify-center overflow-hidden bg-[#0B0B10]",
        className
      )}
    >
      {/* неоновая подсветка за спиной */}
      <div className="pointer-events-none absolute left-1/2 top-[30%] h-[380px] w-[380px] -translate-x-1/2 rounded-full bg-violet/20 blur-[110px]" />

      <div
        className="relative"
        style={{ height: "96%", aspectRatio: "736 / 1308", animation: "charBreathe 4.6s ease-in-out infinite" }}
      >
        {/* базовый слой */}
        <img
          src="/character.png"
          alt=""
          draggable={false}
          className="absolute inset-0 h-full w-full select-none object-contain"
          style={{
            transform: "translate3d(calc(var(--hx, 0) * -9px), calc(var(--hy, 0) * -7px), 0)",
            transition: "transform 0.28s ease-out",
          }}
        />
        {/* слой головы: следует за курсором */}
        <img
          src="/character.png"
          alt=""
          draggable={false}
          className="absolute inset-0 h-full w-full select-none object-contain"
          style={{
            clipPath: `ellipse(17% 12.5% at ${HEAD.x}% ${HEAD.y}%)`,
            WebkitClipPath: `ellipse(17% 12.5% at ${HEAD.x}% ${HEAD.y}%)`,
            transformOrigin: `${HEAD.x}% ${HEAD.y + 5}%`,
            transform:
              "translate3d(calc(var(--hx, 0) * 15px), calc(var(--hy, 0) * 11px), 0) rotate(calc(var(--hx, 0) * 2.5deg))",
            transition: "transform 0.24s ease-out",
            filter: "drop-shadow(0 0 26px rgba(124,108,240,0.28))",
          }}
        />
      </div>
    </div>
  );
}
