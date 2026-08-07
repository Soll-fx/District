"use client";

import { create } from "zustand";

export type TradesView = "gallery" | "list" | "calendar";
export type LibrariesTab = "tags" | "assets" | "sessions" | "strategies";

type UiState = {
  tradesView: TradesView;
  librariesTab: LibrariesTab;
  setTradesView: (view: TradesView) => void;
  setLibrariesTab: (tab: LibrariesTab) => void;
};

export const useUiStore = create<UiState>((set) => ({
  tradesView: "gallery",
  librariesTab: "tags",
  setTradesView: (tradesView) => set({ tradesView }),
  setLibrariesTab: (librariesTab) => set({ librariesTab }),
}));
