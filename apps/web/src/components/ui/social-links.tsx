"use client";

import { Send } from "lucide-react";
import { cn } from "@/lib/utils";

function socialUrl(key: string, raw: string): string {
  const v = raw.trim();
  if (/^https?:\/\//i.test(v)) return v;
  const handle = v.replace(/^@/, "").replace(/\/$/, "");
  switch (key) {
    case "telegram":
      return `https://t.me/${handle}`;
    case "instagram":
      return `https://instagram.com/${handle}`;
    case "youtube":
      return `https://youtube.com/@${handle}`;
    case "tradingview":
      return `https://tradingview.com/u/${handle}`;
    default:
      return v;
  }
}

const ITEMS: {
  key: "instagram" | "telegram" | "youtube" | "tradingview";
  bg: string;
}[] = [
  { key: "instagram", bg: "#E1306C" },
  { key: "telegram", bg: "#229ED9" },
  { key: "youtube", bg: "#FF0000" },
  { key: "tradingview", bg: "#2962FF" },
];

function IgIcon({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
      <rect x="2.5" y="2.5" width="19" height="19" rx="5.5" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="17.8" cy="6.2" r="1.3" fill="currentColor" stroke="none" />
    </svg>
  );
}

function YtIcon({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M22 12c0-2.4-.25-4-.55-4.9a3 3 0 0 0-2.05-2C17.7 4.75 12 4.75 12 4.75s-5.7 0-7.4.35a3 3 0 0 0-2.05 2C2.25 8 2 9.6 2 12s.25 4 .55 4.9a3 3 0 0 0 2.05 2c1.7.35 7.4.35 7.4.35s5.7 0 7.4-.35a3 3 0 0 0 2.05-2C21.75 16 22 14.4 22 12ZM10 15.2V8.8l5.5 3.2L10 15.2Z" />
    </svg>
  );
}

function TvIcon({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M2 6h7v3H2z" />
      <path d="M4.2 9h3l2.6 8h-3z" />
      <path d="M12 17V6h3v11z" />
      <path d="M16.5 6H20a3.5 3.5 0 1 1 0 7h-.5v4h-3z" />
    </svg>
  );
}

export function SocialLinks({
  values,
  className,
  size = 34,
}: {
  values: Partial<Record<"instagram" | "telegram" | "youtube" | "tradingview", string | null>>;
  className?: string;
  size?: number;
}) {
  const filled = ITEMS.filter((i) => values[i.key]?.trim());
  if (!filled.length) return null;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {filled.map((i) => (
        <a
          key={i.key}
          href={socialUrl(i.key, values[i.key]!)}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={i.key}
          title={values[i.key]!.replace(/^@/, "")}
          className="flex shrink-0 items-center justify-center rounded-full text-white shadow-card transition-transform duration-200 hover:scale-110"
          style={{ width: size, height: size, background: i.bg }}
        >
          {i.key === "instagram" && <IgIcon size={size * 0.46} />}
          {i.key === "telegram" && <Send size={size * 0.44} />}
          {i.key === "youtube" && <YtIcon size={size * 0.52} />}
          {i.key === "tradingview" && <TvIcon size={size * 0.44} />}
        </a>
      ))}
    </div>
  );
}
