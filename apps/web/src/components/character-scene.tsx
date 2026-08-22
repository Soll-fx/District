"use client";

import { useCallback, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

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
        "relative flex h-full w-full items-center justify-center overflow-hidden bg-[#0B0B10]",
        className
      )}
    >
      {/* неоновая подсветка */}
      <div className="pointer-events-none absolute left-1/2 top-[32%] h-[400px] w-[400px] -translate-x-1/2 rounded-full bg-violet/20 blur-[110px]" />

      <div
        className="absolute inset-[-14px]"
        style={{
          transform:
            "translate3d(calc(var(--hx, 0) * -12px), calc(var(--hy, 0) * -9px), 0)",
          transition: "transform 0.3s ease-out",
        }}
      >
        <video
          src="/character-loop.mp4"
          autoPlay
          loop
          muted
          playsInline
          disablePictureInPicture
          controls={false}
          className="h-full w-full object-cover"
        />
      </div>
    </div>
  );
}
