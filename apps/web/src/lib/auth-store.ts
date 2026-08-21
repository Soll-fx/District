import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type AuthUser = {
  id: string;
  email: string;
  name?: string;
  role?: string;
  locale?: "ru" | "en";
  timezone?: string;
  avatarUrl?: string | null;
  instagram?: string | null;
  telegram?: string | null;
  youtube?: string | null;
  tradingview?: string | null;
};

type AuthState = {
  token: string | null;
  user: AuthUser | null;
  hydrated: boolean;
  setSession: (token: string, user: AuthUser) => void;
  setHydrated: () => void;
  logout: () => void;
};

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      hydrated: false,
      setSession: (token, user) => set({ token, user }),
      setHydrated: () => set({ hydrated: true }),
      logout: () => set({ token: null, user: null }),
    }),
    {
      name: "sollo-auth",
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => state?.setHydrated(),
    },
  ),
);
