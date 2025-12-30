import { createStore } from "zustand";
import { persist } from "zustand/middleware";

export type Data = {
  openRequestFiles: string[];
  selectedRequestFile: string | null;
};

export type Action = {
  setOpenRequestFiles(value: string[]): void;
  setSelectedRequestFile(value: string | null): void;
  closeRequestfile(fileToClose: string): void;
};

export type Store = Data & Action;

export const useOpenRequestFilesStore = createStore<Store>()(
  persist(
    (set) => ({
      openRequestFiles: [],
      selectedRequestFile: null,
      setOpenRequestFiles: (value: string[]) => {
        return set({
          openRequestFiles: value,
          selectedRequestFile: value.length === 0 ? null : value[0],
        });
      },
      setSelectedRequestFile: (value: string | null) => {
        return set({ selectedRequestFile: value });
      },
      closeRequestfile(fileToClose) {
        return set((prev) => {
          debugger;
          return {
            openRequestFiles: prev.openRequestFiles.filter(
              (item) => item !== fileToClose
            ),
            selectedRequestFile:
              prev.selectedRequestFile === fileToClose
                ? null
                : prev.selectedRequestFile,
          };
        });
      },
    }),
    { name: "reqlang-selected-file" }
  )
);
