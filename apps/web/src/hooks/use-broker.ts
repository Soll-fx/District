"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { BrokerAccount } from "@/lib/types";

export function useBrokerAccounts() {
  return useQuery({
    queryKey: ["broker-accounts"],
    queryFn: () => api.get<BrokerAccount[]>("/broker/accounts"),
  });
}

export type ConnectBrokerInput = {
  apiProvider: "mock" | "metapi";
  accountId?: string;
  login: string;
  serverName: string;
};

export function useConnectBroker() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ConnectBrokerInput) =>
      api.post<BrokerAccount[]>("/broker/connect", input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["broker-accounts"] });
    },
  });
}

export function useDisconnectBroker() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.post<BrokerAccount[]>("/broker/disconnect", { id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["broker-accounts"] });
    },
  });
}

export function useSyncBroker() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.post<{ account: string | null; synced: number }>("/broker/sync"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["broker-accounts"] });
      queryClient.invalidateQueries({ queryKey: ["trades"] });
    },
  });
}
