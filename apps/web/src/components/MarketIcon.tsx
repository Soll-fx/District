import { cn } from "@/lib/utils";
import { CURRENCY_ISO, FlagBody, isoOf } from "@/components/FlagIcon";

const KIND_COLOR: Record<string, string> = {
  gold: "#D9A441",
  silver: "#9AA3B2",
  btc: "#F7931A",
  eth: "#627EEA",
  index: "#39455C",
  default: "#7C6CF0",
};

export type MarketIconKind =
  | "gold"
  | "silver"
  | "btc"
  | "eth"
  | "index"
  | "pair"
  | "flag"
  | "default";

export function marketKindOf(input: string): MarketIconKind {
  const raw = (input ?? "").toUpperCase();
  const s = raw.replace(/\//g, "").trim();
  if (/^XAU|^GOLD|ЗОЛОТ/.test(raw)) return "gold";
  if (/^XAG|^SILVER|СЕРЕБР/.test(raw)) return "silver";
  if (/^BTC|BITCOIN|БИТКОИН/.test(raw)) return "btc";
  if (/^ETH|ETHER|ЭФИР/.test(raw)) return "eth";
  if (/^(US30|NAS|SPX|US500|GER|UK100|INDEX|ИНДЕКС)/.test(s)) return "index";
  if (/^[A-Z]{6}$/.test(s)) {
    const base = s.slice(0, 3);
    const quote = s.slice(3);
    if (CURRENCY_ISO[base] && CURRENCY_ISO[quote]) return "pair";
  }
  if (CURRENCY_ISO[s]) return "flag";
  if (/[\u{1F1E6}-\u{1F1FF}]{2}/u.test(raw)) return "flag";
  return "default";
}

function pairOf(input: string): [string, string] | null {
  const s = (input ?? "").toUpperCase().replace(/\//g, "").trim();
  if (!/^[A-Z]{6}$/.test(s)) return null;
  const base = s.slice(0, 3);
  const quote = s.slice(3);
  if (CURRENCY_ISO[base] && CURRENCY_ISO[quote]) return [base, quote];
  return null;
}

function BtcIcon() {
  return (
    <svg viewBox="0 0 320 512" fill="white" className="h-[55%] w-[55%]" aria-hidden>
      <path d="M248.53 233.9c18.12-10.6 30.47-28.2 30.47-49.6 0-35.1-27.9-63.3-62.5-64.9V64h-40v54.4h-48V64h-40v54.4H24v40h24.4c7.6 0 13.6 6.1 13.6 13.7v151.9c0 7.6-6 13.7-13.6 13.7H48v40h24.4v54.4h40v-54.4h48v54.4h40v-54.4c34.6-1.6 62.5-29.8 62.5-64.9 0-21.4-12.3-39-30.47-49.6zM112.4 114.4h40v41.6h-40v-41.6zm0 176.8v-41.6h48v41.6h-48zm64.6 0V179.2c8.4 1.5 44.2 10.1 44.2 56.7 0 46.6-35.8 55.3-44.2 55.3z" />
    </svg>
  );
}

function EthIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="white" className="h-[55%] w-[55%]" aria-hidden>
      <path d="M12 2l7 10-7 10-7-10 7-10z" />
      <path d="M12 13.6L5.4 11 12 2l6.6 9L12 13.6z" opacity="0.55" />
    </svg>
  );
}

function GoldIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[55%] w-[55%]" aria-hidden>
      <g fill="white" opacity="0.95">
        <rect x="8" y="7" width="2.6" height="6" rx="0.6" />
        <rect x="8.8" y="4.5" width="0.9" height="12" />
        <rect x="13.4" y="5" width="2.6" height="5" rx="0.6" />
        <rect x="14.2" y="3" width="0.9" height="10" />
      </g>
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="h-[55%] w-[55%]" aria-hidden>
      <path d="M3 17l5.2-5.6 4 3L20 6" />
      <path d="M15 6h5v5" />
    </svg>
  );
}

export function MarketIcon({
  symbol,
  kind,
  size = 28,
  className,
}: {
  symbol: string;
  kind?: MarketIconKind;
  size?: number;
  className?: string;
}) {
  const resolved = kind ?? marketKindOf(symbol);

  if (resolved === "pair") {
    const pair = pairOf(symbol);
    if (pair) {
      const [base, quote] = pair;
      return (
        <span
          className={cn("inline-flex shrink-0 select-none items-center justify-center rounded-full", className)}
          style={{
            width: size,
            height: size,
            boxShadow: "0 0 0 1px rgba(0,0,0,0.25), 0 2px 6px rgba(0,0,0,0.35)",
          }}
        >
          <span className="relative block h-full w-full overflow-hidden rounded-full bg-white">
            <svg
              viewBox="0 0 24 24"
              preserveAspectRatio="xMidYMid slice"
              className="absolute inset-0 h-full w-full"
              style={{ clipPath: "polygon(0 0, 100% 0, 0 100%)" }}
            >
              {FlagBody({ iso: CURRENCY_ISO[base] })}
            </svg>
            <svg
              viewBox="0 0 24 24"
              preserveAspectRatio="xMidYMid slice"
              className="absolute inset-0 h-full w-full"
              style={{ clipPath: "polygon(100% 0, 100% 100%, 0 100%)" }}
            >
              {FlagBody({ iso: CURRENCY_ISO[quote] })}
            </svg>
          </span>
        </span>
      );
    }
  }

  const color = KIND_COLOR[resolved] ?? KIND_COLOR.default;

  if (resolved === "flag") {
    const iso = isoOf(symbol);
    return (
      <span
        className={cn("inline-flex shrink-0 select-none items-center justify-center overflow-hidden rounded-full bg-white", className)}
        style={{
          width: size,
          height: size,
          boxShadow: "0 0 0 1px rgba(0,0,0,0.25), 0 2px 6px rgba(0,0,0,0.35)",
        }}
      >
        <svg viewBox="0 0 24 24" preserveAspectRatio="xMidYMid slice" className="h-full w-full">
          {FlagBody({ iso })}
        </svg>
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex shrink-0 select-none items-center justify-center rounded-full text-white",
        className,
      )}
      style={{
        width: size,
        height: size,
        background: color,
        boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.18)",
      }}
    >
      {resolved === "gold" || resolved === "silver" ? (
        <GoldIcon />
      ) : resolved === "index" ? (
        <ChartIcon />
      ) : resolved === "eth" ? (
        <EthIcon />
      ) : resolved === "btc" ? (
        <BtcIcon />
      ) : (
        <span className="font-extrabold leading-none tracking-tight" style={{ fontSize: size * 0.42 }}>
          {symbol.charAt(0).toUpperCase()}
        </span>
      )}
    </span>
  );
}
