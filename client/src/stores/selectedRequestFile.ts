import { createStore } from "zustand";
import { persist } from "zustand/middleware";

type Store = {
  openRequestFiles: string[];
  selectedRequestFile: string | null;
};

type Action = {
  setOpenRequestFiles(value: string[]): void;
  setSelectedRequestFile(value: string | null): void;
};

export const useOpenRequestFilesStore = createStore<Store & Action>()(
  persist(
    (set) => ({
      openRequestFiles: [],
      selectedRequestFile: null,
      setOpenRequestFiles: (value: string[]) =>
        set({ openRequestFiles: value }),
      setSelectedRequestFile: (value: string | null) =>
        set({ selectedRequestFile: value }),
    }),
    { name: "reqlang-selected-file" }
  )
);
