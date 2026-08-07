export type SessionKey = "ASIA" | "FRANKFURT" | "LONDON" | "NEW_YORK";

export type SessionInfo = {
  key: SessionKey;
  region: string;
  open: string;
  close: string;
  active: boolean;
  progress: number;
};

export type NextOpen = { key: SessionKey; region: string; label: string; at: number };

export type SessionsResult = {
  sessions: SessionInfo[];
  active: SessionKey | null;
  nextOpen: NextOpen | null;
};

// Сессии закреплены за локальным временем биржи (IANA).
// Переход на летнее/зимнее время обрабатывается автоматически через Intl.
// Локальные часы получены из BTA Trading Sessions (UTC+5, лето):
//   Азия 04:00-12:00  -> Токио 08:00-16:00
//   Франкфурт 11:00-12:00 -> Берлин 08:00-09:00
//   Лондон 12:00-17:00 -> Лондон 08:00-13:00
//   Нью-Йорк 17:00-01:00 -> Нью-Йорк 08:00-16:00
const SESSION_DEFS: { key: SessionKey; tz: string; open: number; close: number; region: string }[] = [
  { key: "ASIA", tz: "Asia/Tokyo", open: 8, close: 16, region: "Азия" },
  { key: "FRANKFURT", tz: "Europe/Berlin", open: 8, close: 9, region: "Франкфурт" },
  { key: "LONDON", tz: "Europe/London", open: 8, close: 13, region: "Лондон" },
  { key: "NEW_YORK", tz: "America/New_York", open: 8, close: 16, region: "Нью-Йорк" },
];

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

function formatInTz(date: Date, tz: string) {
  try {
    const parts = new Intl.DateTimeFormat("en", {
      timeZone: tz,
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).formatToParts(date);
    const h = parts.find((p) => p.type === "hour")?.value ?? "00";
    const m = parts.find((p) => p.type === "minute")?.value ?? "00";
    return `${h}:${m}`;
  } catch {
    return `${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}`;
  }
}

// Смещение таймзоны (мс) относительно UTC в заданный момент.
function tzOffsetMs(dt: Date, tz: string): number {
  const parts = new Intl.DateTimeFormat("en", {
    timeZone: tz,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(dt);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "0";
  const localAsUtc = Date.UTC(
    +get("year"),
    +get("month") - 1,
    +get("day"),
    +get("hour"),
    +get("minute"),
    +get("second"),
  );
  return localAsUtc - dt.getTime();
}

// UTC-момент, когда в таймзоне tz наступает local (часы/минуты) в указанный календарный день.
function localTimeToUtc(tz: string, year: number, month: number, day: number, hour: number): number {
  const noon = Date.UTC(year, month - 1, day, 12);
  const off = tzOffsetMs(new Date(noon), tz);
  return Date.UTC(year, month - 1, day, hour, 0) - off;
}

// Календарные компоненты даты dt в таймзоне tz.
function tzDateParts(dt: Date, tz: string) {
  const parts = new Intl.DateTimeFormat("en", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(dt);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "0";
  return { year: +get("year"), month: +get("month"), day: +get("day") };
}

// 0 = воскресенье ... 6 = суббота в таймзоне tz.
function weekdayOf(dt: Date, tz: string): number {
  const parts = new Intl.DateTimeFormat("en", {
    timeZone: tz,
    weekday: "short",
  }).formatToParts(dt);
  const wd = parts.find((p) => p.type === "weekday")?.value ?? "";
  const idx = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(wd);
  return idx < 0 ? 0 : idx;
}

function isWeekend(dt: Date, tz: string): boolean {
  const wd = weekdayOf(dt, tz);
  return wd === 0 || wd === 6;
}

// День недели в таймзоне биржи для момента открытия сессии.
function weekdayAt(ts: number, tz: string): number {
  return weekdayOf(new Date(ts), tz);
}

export function getSessions(now: Date, timezone: string): SessionsResult {
  const nowMs = now.getTime();
  const weekend = isWeekend(now, timezone);

  const sessions = SESSION_DEFS.map((s) => {
    const d = tzDateParts(now, s.tz);
    const openAt = localTimeToUtc(s.tz, d.year, d.month, d.day, s.open);
    const closeAt = localTimeToUtc(s.tz, d.year, d.month, d.day, s.close);

    const active =
      !weekend && weekdayAt(openAt, s.tz) >= 1 && weekdayAt(openAt, s.tz) <= 5
        ? nowMs >= openAt && nowMs < closeAt
        : false;
    const progress = active
      ? Math.min(100, ((nowMs - openAt) / (closeAt - openAt)) * 100)
      : 0;

    return {
      key: s.key,
      region: s.region,
      open: formatInTz(new Date(openAt), timezone),
      close: formatInTz(new Date(closeAt), timezone),
      active,
      progress,
    };
  });

  const active = sessions.find((s) => s.active)?.key ?? null;

  // следующая сессия, которая откроется в будний день (пн-пт)
  let nextOpen: NextOpen | null = null;
  for (const s of SESSION_DEFS) {
    for (let offsetDays = 0; offsetDays <= 3; offsetDays++) {
      const ref = new Date(nowMs + offsetDays * 86_400_000);
      const d = tzDateParts(ref, s.tz);
      const openAt = localTimeToUtc(s.tz, d.year, d.month, d.day, s.open);
      if (openAt <= nowMs) continue;
      const exWd = weekdayAt(openAt, s.tz);
      const usrWd = weekdayOf(new Date(openAt), timezone);
      if (exWd < 1 || exWd > 5) continue;
      if (usrWd < 1 || usrWd > 5) continue;
      if (!nextOpen || openAt < nextOpen.at) {
        nextOpen = {
          key: s.key,
          region: s.region,
          label: `${s.region} · ${formatInTz(new Date(openAt), timezone)}`,
          at: openAt,
        };
      }
      break;
    }
  }

  return { sessions, active, nextOpen };
}

export function formatCountdown(target: number): string {
  const diff = Math.max(0, target - Date.now());
  const h = Math.floor(diff / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  if (h <= 0) return `${m} мин`;
  return `${h} ч ${m} мин`;
}

export function regionKey(key: SessionKey): string {
  switch (key) {
    case "ASIA":
      return "asia";
    case "FRANKFURT":
      return "frankfurt";
    case "LONDON":
      return "london";
    case "NEW_YORK":
      return "newyork";
  }
}
