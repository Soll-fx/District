import type { ReactNode } from "react";

export const CURRENCY_ISO: Record<string, string> = {
  USD: "US",
  EUR: "EU",
  GBP: "GB",
  JPY: "JP",
  AUD: "AU",
  NZD: "NZ",
  CAD: "CA",
  CHF: "CH",
  CNY: "CN",
  RUB: "RU",
  SEK: "SE",
  NOK: "NO",
  MXN: "MX",
  TRY: "TR",
  ZAR: "ZA",
  SGD: "SG",
  HKD: "HK",
  KRW: "KR",
  INR: "IN",
  BRL: "BR",
};

const REGION_ISO: Array<[RegExp, string]> = [
  [/ЕВРОЗОНА|ЕВРОСОЮЗ/, "EU"],
  [/США|АМЕРИК|СОЕДИНЕНН/, "US"],
  [/ВЕЛИКОБРИТ|БРИТАН|ФУНТ/, "GB"],
  [/ГЕРМАНИ/, "DE"],
  [/ФРАНЦ/, "FR"],
  [/ИТАЛИ/, "IT"],
  [/ИСПАНИ/, "ES"],
  [/ПОЛЬШ/, "PL"],
  [/УКРАИН/, "UA"],
  [/ШВЕЦИ/, "SE"],
  [/НОРВЕГИ/, "NO"],
  [/ДАНИ/, "DK"],
  [/ЯПОНИ|ИЕНА/, "JP"],
  [/КИТАЙ|ЮАН/, "CN"],
  [/АВСТРАЛ/, "AU"],
  [/НОВОЗЕЛАНД/, "NZ"],
  [/КАНАД/, "CA"],
  [/ШВЕЙЦАР|ФРАНК/, "CH"],
  [/РОССИ/, "RU"],
  [/КОРЕ/, "KR"],
  [/ИНДИ/, "IN"],
];

export function emojiToIso(input: string): string {
  return Array.from(input)
    .filter((c) => {
      const cp = c.codePointAt(0)!;
      return cp >= 0x1f1e6 && cp <= 0x1f1ff;
    })
    .map((c) => String.fromCharCode(c.codePointAt(0)! - 0x1f1e6 + 65))
    .join("");
}

export function isoOf(input: string): string {
  const raw = (input ?? "").toUpperCase();
  const currency = raw.replace(/[^A-Z0-9]/g, "").slice(0, 3);
  if (CURRENCY_ISO[currency]) return CURRENCY_ISO[currency];
  const emoji = emojiToIso(input ?? "");
  if (emoji) return emoji;
  const region = REGION_ISO.find(([re]) => re.test(raw));
  return region ? region[1] : "";
}

function Star({ cx, cy, r, fill }: { cx: string | number; cy: string | number; r: string | number; fill: string }) {
  const cxN = Number(cx);
  const cyN = Number(cy);
  const rN = Number(r);
  const pts = Array.from({ length: 10 }, (_, i) => {
    const rad = i % 2 === 0 ? rN : rN * 0.45;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    return `${(cxN + rad * Math.cos(a)).toFixed(2)},${(cyN + rad * Math.sin(a)).toFixed(2)}`;
  }).join(" ");
  return <polygon points={pts} fill={fill} />;
}

function NordicCross({
  bg,
  fg,
  border,
  h,
}: {
  bg: string;
  fg: string;
  border?: number;
  h: number;
}) {
  const vw = border ? h + border * 2 : h;
  return (
    <>
      <rect width="24" height="24" fill={bg} />
      {border && <rect x="8.5" y="0" width={vw} height="24" fill="#FFF" />}
      {border && <rect x="0" y="9.6" width="24" height={vw} fill="#FFF" />}
      <rect x="9.4" y="0" width={h} height="24" fill={fg} />
      <rect x="0" y="10.5" width="24" height={h} fill={fg} />
    </>
  );
}

function Candles({ fill }: { fill: string }) {
  return (
    <g fill={fill}>
      <rect x="8" y="7" width="2.6" height="6" rx="0.6" />
      <rect x="8.8" y="4.5" width="0.9" height="12" />
      <rect x="13.4" y="5" width="2.6" height="5" rx="0.6" />
      <rect x="14.2" y="3" width="0.9" height="10" />
    </g>
  );
}

export function FlagBody({ iso }: { iso: string }): ReactNode {
  switch (iso) {
    case "EU":
      return (
        <>
          <rect width="24" height="24" fill="#003399" />
          {Array.from({ length: 12 }, (_, i) => {
            const a = -Math.PI / 2 + (i * Math.PI) / 6;
            return <Star key={i} cx={12 + 8 * Math.cos(a)} cy={12 + 8 * Math.sin(a)} r={1.7} fill="#FFCC00" />;
          })}
        </>
      );
    case "US":
      return (
        <>
          {Array.from({ length: 13 }, (_, i) => (
            <rect key={i} x="0" y={i * (24 / 13)} width="24" height={24 / 13} fill={i % 2 === 0 ? "#B22234" : "#FFF"} />
          ))}
          <rect x="0" y="0" width="10.5" height="13" fill="#3C3B6E" />
          {Array.from({ length: 9 }, (_, i) => {
            const col = i % 5;
            const row = Math.floor(i / 5);
            return <Star key={i} cx={1.2 + col * 2} cy={1.5 + row * 2.2} r={0.65} fill="#FFF" />;
          })}
        </>
      );
    case "GB":
      return (
        <>
          <rect width="24" height="24" fill="#012169" />
          <g fill="#FFF">
            <rect x="10.2" y="-5" width="3.6" height="34" transform="rotate(45 12 12)" />
            <rect x="10.2" y="-5" width="3.6" height="34" transform="rotate(-45 12 12)" />
            <rect x="8.6" y="0" width="6.8" height="24" />
            <rect x="0" y="8.6" width="24" height="6.8" />
          </g>
          <g fill="#C8102E">
            <rect x="11" y="-5" width="2" height="34" transform="rotate(45 12 12)" />
            <rect x="11" y="-5" width="2" height="34" transform="rotate(-45 12 12)" />
            <rect x="10.2" y="0" width="3.6" height="24" />
            <rect x="0" y="10.2" width="24" height="3.6" />
          </g>
        </>
      );
    case "JP":
      return (
        <>
          <rect width="24" height="24" fill="#FFF" />
          <circle cx="12" cy="12" r="7.2" fill="#BC002D" />
        </>
      );
    case "CH":
      return (
        <>
          <rect width="24" height="24" fill="#D52B1E" />
          <rect x="9" y="5" width="6" height="14" fill="#FFF" />
          <rect x="5" y="9" width="14" height="6" fill="#FFF" />
        </>
      );
    case "CA":
      return (
        <>
          <rect width="24" height="24" fill="#FFF" />
          <rect x="0" y="0" width="5" height="24" fill="#D80621" />
          <rect x="19" y="0" width="5" height="24" fill="#D80621" />
          <Star cx="12" cy="12" r="5" fill="#D80621" />
        </>
      );
    case "AU":
      return (
        <>
          <rect width="24" height="24" fill="#012169" />
          <g transform="scale(0.5)">
            <FlagBody iso="GB" />
          </g>
          <g fill="#FFF">
          <Star cx="6" cy="19.5" r="2.2" fill="#FFF" />
            <Star cx="15" cy="6" r="1.5" fill="#FFF" />
            <Star cx="19" cy="10" r="1.5" fill="#FFF" />
            <Star cx="17" cy="17" r="1.5" fill="#FFF" />
            <Star cx="20" cy="19" r="1.3" fill="#FFF" />
          </g>
        </>
      );
    case "NZ":
      return (
        <>
          <rect width="24" height="24" fill="#012169" />
          <g transform="scale(0.5)">
            <FlagBody iso="GB" />
          </g>
          <g fill="#CC142B">
            <Star cx="17" cy="7" r="1.5" fill="#CC142B" />
            <Star cx="20.5" cy="11" r="1.3" fill="#CC142B" />
            <Star cx="16" cy="13.5" r="1.3" fill="#CC142B" />
            <Star cx="21" cy="18" r="1.3" fill="#CC142B" />
          </g>
        </>
      );
    case "CN":
      return (
        <>
          <rect width="24" height="24" fill="#DE2910" />
          <Star cx="5.5" cy="6" r="3" fill="#FFDE00" />
          <Star cx="11" cy="3.5" r="1.1" fill="#FFDE00" />
          <Star cx="13" cy="6" r="1.1" fill="#FFDE00" />
          <Star cx="11.5" cy="8.5" r="1.1" fill="#FFDE00" />
          <Star cx="9.5" cy="8" r="1.1" fill="#FFDE00" />
        </>
      );
    case "RU":
      return (
        <>
          <rect width="24" height="24" fill="#FFF" />
          <rect x="0" y="8" width="24" height="8" fill="#0039A6" />
          <rect x="0" y="16" width="24" height="8" fill="#D52B1E" />
        </>
      );
    case "DE":
      return (
        <>
          <rect width="24" height="24" fill="#000" />
          <rect x="0" y="8" width="24" height="8" fill="#DD0000" />
          <rect x="0" y="16" width="24" height="8" fill="#FFCE00" />
        </>
      );
    case "FR":
      return (
        <>
          <rect width="24" height="24" fill="#0055A4" />
          <rect x="8" y="0" width="8" height="24" fill="#FFF" />
          <rect x="16" y="0" width="8" height="24" fill="#EF4135" />
        </>
      );
    case "IT":
      return (
        <>
          <rect width="24" height="24" fill="#009246" />
          <rect x="8" y="0" width="8" height="24" fill="#FFF" />
          <rect x="16" y="0" width="8" height="24" fill="#CE2B37" />
        </>
      );
    case "ES":
      return (
        <>
          <rect width="24" height="24" fill="#F1BF00" />
          <rect x="0" y="0" width="24" height="5.5" fill="#AA151B" />
          <rect x="0" y="18.5" width="24" height="5.5" fill="#AA151B" />
        </>
      );
    case "PL":
      return (
        <>
          <rect width="24" height="24" fill="#FFF" />
          <rect x="0" y="12" width="24" height="12" fill="#DC143C" />
        </>
      );
    case "UA":
      return (
        <>
          <rect width="24" height="24" fill="#005BBB" />
          <rect x="0" y="12" width="24" height="12" fill="#FFD500" />
        </>
      );
    case "SE":
      return <NordicCross bg="#006AA7" fg="#FECC00" h={4.2} />;
    case "NO":
      return <NordicCross bg="#EF2B2D" fg="#002868" border={1.5} h={3} />;
    case "DK":
      return <NordicCross bg="#C8102E" fg="#FFF" h={4} />;
    case "IN":
      return (
        <>
          <rect width="24" height="24" fill="#FF9933" />
          <rect x="0" y="8" width="24" height="8" fill="#FFF" />
          <rect x="0" y="16" width="24" height="8" fill="#138808" />
          <circle cx="12" cy="12" r="3" fill="#000080" />
          <circle cx="12" cy="12" r="1" fill="#FFF" />
        </>
      );
    case "KR":
      return (
        <>
          <rect width="24" height="24" fill="#FFF" />
          <g transform="rotate(135 12 12)">
            <path d="M12 6 A 6 6 0 0 1 12 18 Z" fill="#CD2E3A" />
            <path d="M12 6 A 6 6 0 0 0 12 18 Z" fill="#0047A0" />
          </g>
          <g fill="#000">
            <rect x="9" y="1.5" width="6" height="1.4" />
            <rect x="10.6" y="3.6" width="6" height="1.4" />
            <rect x="12.2" y="5.7" width="6" height="1.4" />
            <rect x="9" y="20.9" width="6" height="1.4" />
            <rect x="10.6" y="18.9" width="6" height="1.4" />
            <rect x="12.2" y="16.8" width="6" height="1.4" />
          </g>
        </>
      );
    case "BR":
      return (
        <>
          <rect width="24" height="24" fill="#009B3A" />
          <polygon points="12,2 22,12 12,22 2,12" fill="#FEDF00" />
          <circle cx="12" cy="12" r="4.5" fill="#002776" />
          <path d="M7.5 13.5 A 4.5 4.5 0 0 0 16.5 13.5 L12 12 Z" fill="#FFF" />
        </>
      );
    case "MX":
      return (
        <>
          <rect width="24" height="24" fill="#006847" />
          <rect x="8" y="0" width="8" height="24" fill="#FFF" />
          <rect x="16" y="0" width="8" height="24" fill="#CE1126" />
        </>
      );
    case "TR":
      return (
        <>
          <rect width="24" height="24" fill="#E30A17" />
          <circle cx="10" cy="12" r="6" fill="#FFF" />
          <circle cx="11.5" cy="12" r="5" fill="#E30A17" />
          <Star cx="14" cy="12" r="2.6" fill="#FFF" />
        </>
      );
    case "ZA":
      return (
        <>
          <rect width="24" height="24" fill="#007749" />
          <rect x="0" y="0" width="24" height="4" fill="#DE3831" />
          <rect x="0" y="20" width="24" height="4" fill="#002395" />
          <rect x="0" y="10.5" width="24" height="3" fill="#FFB612" />
          <polygon points="0,24 11,12 0,0" fill="#000" />
          <polygon points="0,24 8.5,12 0,0" fill="#FFB612" />
        </>
      );
    case "SG":
      return (
        <>
          <rect width="24" height="24" fill="#FFF" />
          <rect x="0" y="0" width="24" height="12" fill="#EF3340" />
          <circle cx="7" cy="6" r="3.2" fill="#FFF" />
          <circle cx="7.8" cy="6" r="2.6" fill="#EF3340" />
          {Array.from({ length: 5 }, (_, i) => (
            <Star key={i} cx={12 + i * 2} cy={i % 2 === 0 ? 5 : 7} r={0.9} fill="#FFF" />
          ))}
        </>
      );
    case "HK":
      return (
        <>
          <rect width="24" height="24" fill="#DE2910" />
          <g fill="#FFF">
            {Array.from({ length: 5 }, (_, i) => {
              const a = -Math.PI / 2 + (i * Math.PI) / 2.5;
              return (
                <ellipse
                  key={i}
                  cx={12 + 6 * Math.cos(a)}
                  cy={12 + 6 * Math.sin(a)}
                  rx="4"
                  ry="2"
                  transform={`rotate(${(a * 180) / Math.PI} ${12 + 6 * Math.cos(a)} ${12 + 6 * Math.sin(a)})`}
                />
              );
            })}
            <circle cx="12" cy="12" r="1.6" />
          </g>
        </>
      );
    default:
      return null;
  }
}
