"use client";

/* eslint-disable @typescript-eslint/no-namespace */

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

declare global {
  namespace React.JSX {
    interface IntrinsicElements {
      "spline-viewer": {
        url?: string;
        className?: string;
        style?: React.CSSProperties;
        ref?: React.Ref<HTMLElement>;
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
  const ref = useRef<HTMLElement>(null);

  useEffect(loadViewer, []);

  // прячем логотип-ссылку Spline внутри shadow DOM
  useEffect(() => {
    let tries = 0;
    const iv = setInterval(() => {
      tries += 1;
      const el = ref.current;
      const logo = (el?.shadowRoot as ShadowRoot | null)?.querySelector("#logo");
      if (el?.shadowRoot) {
        if (!logo) {
          const st = document.createElement("style");
          st.textContent = "#logo,#logo-link,.spline-logo{display:none!important}";
          el.shadowRoot.appendChild(st);
        } else {
          (logo as HTMLElement).style.display = "none";
        }
      }
      if (logo || tries > 50) clearInterval(iv);
    }, 300);
    return () => clearInterval(iv);
  }, []);

  return (
    <div className={cn("relative overflow-hidden", className)}>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="h-8 w-8 animate-pulse rounded-full bg-white/20" />
      </div>
      <spline-viewer
        ref={ref}
        url={scene}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
      />
    </div>
  );
}
