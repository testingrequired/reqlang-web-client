import { create } from "zustand";

type Store = {
  openRequestFiles: string[];
  selectedRequestFile: string | null;
};

type Action = {
  setOpenRequestFiles(value: string[]): void;
  setSelectedRequestFile(value: string | null): void;
};

export const useOpenRequestFilesStore = create<Store & Action>()((set) => ({
  openRequestFiles: [],
  selectedRequestFile: null,
  setOpenRequestFiles: (value: string[]) => set({ openRequestFiles: value }),
  setSelectedRequestFile: (value: string | null) =>
    set({ selectedRequestFile: value }),
}));
