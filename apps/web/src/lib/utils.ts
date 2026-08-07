import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatMoney(value: number, digits = 0): string {
  const sign = value > 0 ? "+" : value < 0 ? "-" : "";
  return `${sign}$${Math.abs(value).toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })}`;
}

export function formatR(value: number): string {
  const sign = value > 0 ? "+" : value < 0 ? "-" : "";
  return `${sign}${Math.abs(value).toFixed(2)}R`;
}

export function pluralRu(count: number, one: string, few: string, many: string): string {
  const n = Math.abs(count) % 100;
  if (n % 10 === 1 && n !== 11) return one;
  if (n % 10 >= 2 && n % 10 <= 4 && (n < 12 || n > 14)) return few;
  return many;
}

export function tvSnapshotUrl(link: string | null | undefined): string | null {
  if (!link) return null;
  let href = link.trim();
  if (!/^https?:\/\//i.test(href)) href = `https://${href}`;
  let url: URL;
  try {
    url = new URL(href);
  } catch {
    return null;
  }
  if (!url.hostname.toLowerCase().endsWith("tradingview.com")) return null;
  const segs = url.pathname.split("/").filter(Boolean);
  if (segs.length < 2) return null;
  const kind = segs[0].toLowerCase();
  let id = "";
  if (kind === "x") {
    id = segs[1];
  } else if (kind === "chart") {
    id = segs[segs.length - 1].split("-")[0];
  } else {
    return null;
  }
  if (!/^[A-Za-z0-9]+$/.test(id)) return null;
  return `https://s3.tradingview.com/snapshots/${id[0].toLowerCase()}/${id}.png`;
}
