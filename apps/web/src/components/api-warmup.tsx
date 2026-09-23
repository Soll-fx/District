"use client";

import { useEffect } from "react";
import { API_URL } from "@/lib/api";

const INTERVAL = 3 * 60 * 1000;

export function ApiWarmup() {
  useEffect(() => {
    const ping = () => {
      fetch(`${API_URL}/health`).catch(() => {});
    };
    ping();
    const t = window.setInterval(ping, INTERVAL);
    return () => window.clearInterval(t);
  }, []);

  return null;
}