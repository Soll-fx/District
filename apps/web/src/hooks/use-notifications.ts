import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export type NotificationPrefs = {
  emailNotif: boolean;
  pushNotif: boolean;
  ideaAlerts: boolean;
  weeklyDigest: boolean;
  subscribed: boolean;
};

export type UpdatePrefsInput = {
  emailNotif?: boolean;
  pushNotif?: boolean;
  ideaAlerts?: boolean;
  weeklyDigest?: boolean;
};

export function useNotificationPrefs() {
  return useQuery({
    queryKey: ["notifications", "prefs"],
    queryFn: () => api.get<NotificationPrefs>("/notifications/preferences"),
  });
}

export function useUpdateNotificationPrefs() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdatePrefsInput) =>
      api.patch<Partial<NotificationPrefs>>("/notifications/preferences", input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", "prefs"] });
    },
  });
}

export function useSubscribePush() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { endpoint: string; p256dh: string; auth: string }) =>
      api.post("/notifications/subscribe", input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", "prefs"] });
    },
  });
}

export function useUnsubscribePush() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (endpoint: string) =>
      api.delete("/notifications/subscribe", { data: { endpoint } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", "prefs"] });
    },
  });
}

export function useTestPush() {
  return useMutation({
    mutationFn: () => api.post<{ sent: number }>("/notifications/test"),
  });
}
