"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

type TimelineAnimationProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
};

export function TimelineAnimation({ children, className, delay = 0 }: TimelineAnimationProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      const timer = setTimeout(() => setVisible(true), 0);
      return () => clearTimeout(timer);
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: "-40px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className={className} style={{ opacity: visible ? 1 : 0 }}>
      <div className="animate-in" style={{ animationDelay: `${delay}ms` }}>
        {children}
      </div>
    </div>
  );
}
