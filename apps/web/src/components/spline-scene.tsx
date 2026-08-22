"use client";

/* eslint-disable @typescript-eslint/no-namespace */

import { useEffect } from "react";
import { cn } from "@/lib/utils";

declare global {
  namespace React.JSX {
    interface IntrinsicElements {
      "spline-viewer": {
        url?: string;
        className?: string;
        style?: React.CSSProperties;
      };
    }
  }
}

let viewerLoading = false;

function loadViewer() {
  if (viewerLoading || typeof document === "undefined") return;
  viewerLoading = true;
  const s = document.createElement("script");
  s.type = "module";
  s.src = "https://unpkg.com/@splinetool/viewer/build/spline-viewer.js";
  document.head.appendChild(s);
}

interface SplineSceneProps {
  scene: string;
  className?: string;
}

export function SplineScene({ scene, className }: SplineSceneProps) {
  useEffect(loadViewer, []);

  return (
    <div className={cn("relative overflow-hidden", className)}>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="h-8 w-8 animate-pulse rounded-full bg-white/20" />
      </div>
      <spline-viewer
        url={scene}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
      />
    </div>
  );
}
