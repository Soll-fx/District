"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface SplineSceneProps {
  scene: string;
  className?: string;
}

// Грузим @splinetool/runtime напрямую с CDN на голый <canvas>:
// это тот же движок, что у их <spline-viewer>, но без водяного знака.
export function SplineScene({ scene, className }: SplineSceneProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let disposed = false;

    (async () => {
      try {
        const runtimeUrl = "https://unpkg.com/@splinetool/runtime/build/runtime.js";
        const mod = (await import(
          /* webpackIgnore: true */ /* turbopackIgnore: true */ runtimeUrl
        )) as {
          Application: new (canvas: HTMLCanvasElement) => {
            load: (u: string) => Promise<void>;
            dispose?: () => void;
          };
        };
        if (disposed || !canvasRef.current) return;
        const app = new mod.Application(canvasRef.current);
        await app.load(scene);
        if (disposed) app.dispose?.();
      } catch (err) {
        console.error("Spline runtime failed:", err);
      }
    })();

    return () => {
      disposed = true;
    };
  }, [scene]);

  return (
    <div className={cn("relative overflow-hidden", className)}>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="h-8 w-8 animate-pulse rounded-full bg-white/20" />
      </div>
      <canvas
        ref={canvasRef}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
      />
    </div>
  );
}
