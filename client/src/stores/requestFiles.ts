import { createStore } from "zustand";
import { persist } from "zustand/middleware";

export type Data = {
  openedFiles: string[];
  activeFile: string | null;
};

export type Action = {
  openFiles(value: string[]): void;
  setActiveFile(value: string | null): void;
  closeFile(fileToClose: string): void;
  closeAllFiles(): void;
};

export type Store = Data & Action;

/**
 * A store to track which request files are open and which one is active
 */
export const useRequestFilesStore = createStore<Store>()(
  persist(
    (set) => ({
      openedFiles: [],
      activeFile: null,
      openFiles: (requestFilePathsToOpen: string[]) =>
        set({
          openedFiles: requestFilePathsToOpen,
          activeFile:
            requestFilePathsToOpen.length === 0
              ? null
              : requestFilePathsToOpen[0],
        }),
      setActiveFile: (requestFilePath: string | null) =>
        set({ activeFile: requestFilePath }),
      closeFile: (requestFilePath: string) =>
        set((prev) => ({
          openedFiles: prev.openedFiles.filter(
            (item) => item !== requestFilePath
          ),
          activeFile:
            prev.activeFile === requestFilePath ? null : prev.activeFile,
        })),
      closeAllFiles: () =>
        set({
          openedFiles: [],
          activeFile: null,
        }),
    }),
    { name: "reqlang-request-files" }
  )
);
