"use client";

import { useEffect } from "react";
import { io } from "socket.io-client";
import { useQueryClient } from "@tanstack/react-query";
import { WS_URL } from "@/lib/api";
import { useAuth } from "@/lib/auth-store";

export function useInboxSocket() {
  const queryClient = useQueryClient();
  const token = useAuth((s) => s.token);

  useEffect(() => {
    if (!token) return;
    const socket = io(`${WS_URL}/inbox`, {
      auth: { token },
      transports: ["websocket"],
    });
    const onUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ["inbox"] });
    };
    socket.on("inbox.updated", onUpdate);
    return () => {
      socket.disconnect();
    };
  }, [token, queryClient]);
}
