import { create } from "zustand";

type Store = {
  value: string | null;
};

type Action = {
  set(value: string | null): void;
};

export const useSelectedRequestFileStore = create<Store & Action>()((set) => ({
  value: null,
  set: (value: string | null) => set({ value }),
  unset: () => set({ value: null }),
}));
