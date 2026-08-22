"use client";

import { useCallback, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

// координаты центра головы в % от размера картинки (посчитаны по пикселям)
const HEAD = { x: 53.5, y: 19.5, rx: 38, ry: 22 };

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
            transform: "translate3d(calc(var(--hx, 0) * -7px), calc(var(--hy, 0) * -6px), 0)",
            transition: "transform 0.3s ease-out",
          }}
        />
        {/* слой головы: мягкая маска, следует за курсором */}
        <img
          src="/character.png"
          alt=""
          draggable={false}
          className="absolute inset-0 h-full w-full select-none object-contain"
          style={{
            WebkitMaskImage: `radial-gradient(ellipse ${HEAD.rx}% ${HEAD.ry}% at ${HEAD.x}% ${HEAD.y}%, black 52%, transparent 76%)`,
            maskImage: `radial-gradient(ellipse ${HEAD.rx}% ${HEAD.ry}% at ${HEAD.x}% ${HEAD.y}%, black 52%, transparent 76%)`,
            transformOrigin: `${HEAD.x}% ${HEAD.y + 14}%`,
            transform:
              "translate3d(calc(var(--hx, 0) * 11px), calc(var(--hy, 0) * 9px), 0) scale(1.02)",
            transition: "transform 0.26s ease-out",
          }}
        />
      </div>
    </div>
  );
}
