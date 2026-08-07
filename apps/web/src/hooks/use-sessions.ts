"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth-store";
import { getSessions, formatCountdown, type SessionsResult } from "@/lib/sessions";

export function useSessions() {
  const timezone = useAuth((s) => s.user?.timezone) || "Europe/Moscow";
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  return useMemo<SessionsResult & { countdown: string }>(() => {
    const result = getSessions(new Date(now), timezone);
    return {
      ...result,
      countdown: result.nextOpen ? formatCountdown(result.nextOpen.at) : "",
    };
  }, [now, timezone]);
}
