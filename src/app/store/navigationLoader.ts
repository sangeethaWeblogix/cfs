"use client";

import { create } from "zustand";

type NavState = {
  navigating: boolean;
  start: () => void;
  stop: () => void;
};

export const useNavigationLoaderStore = create<NavState>((set) => ({
  navigating: false,
  start: () => set({ navigating: true }),
  stop: () => set({ navigating: false }),
}));
