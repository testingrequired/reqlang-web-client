import { createStore } from "zustand";
import { persist } from "zustand/middleware";
import { v4 as uuid } from "uuid";

export type DraftFile = {
  path: string;
  content: string;
};

export type Data = {
  openedFiles: string[];
  activeFile: string | null;
  draftFiles: DraftFile[];
};

export type Action = {
  openFiles(value: string[]): void;
  openFile(value: string): void;
  setActiveFile(value: string | null): void;
  closeFile(fileToClose: string): void;
  closeAllFiles(): void;
  newDraftFile(): void;
  saveDraftFile(path: string, content: string): void;
  getDraftFileContent(path: string): string;
};

export type Store = Data & Action;

/**
 * A store to track which request files are open and which one is active
 */
export const useRequestFilesStore = createStore<Store>()(
  persist(
    (set, get) => ({
      openedFiles: [],
      draftFiles: [],
      activeFile: null,
      openFiles: (requestFilePathsToOpen: string[]) =>
        set({
          openedFiles: requestFilePathsToOpen,
          activeFile:
            requestFilePathsToOpen.length === 0
              ? null
              : requestFilePathsToOpen[0],
        }),
      openFile: (requestFilePathToOpen: string) =>
        set((prev) => ({
          openedFiles: [...prev.openedFiles, requestFilePathToOpen],
          activeFile: requestFilePathToOpen,
        })),
      setActiveFile: (requestFilePath: string | null) =>
        set({ activeFile: requestFilePath }),
      closeFile: (requestFilePath: string) =>
        set((prev) => ({
          openedFiles: prev.openedFiles.filter(
            (item) => item !== requestFilePath,
          ),
          draftFiles: prev.draftFiles.filter(
            (item) => item.path !== requestFilePath,
          ),
          activeFile:
            prev.activeFile === requestFilePath ? null : prev.activeFile,
        })),
      closeAllFiles: () =>
        set({
          openedFiles: [],
          draftFiles: [],
          activeFile: null,
        }),
      newDraftFile: () =>
        set((prev) => {
          const newPath = `draft-${uuid().slice(0, 5)}`;
          return {
            draftFiles: [
              ...prev.draftFiles,
              {
                path: newPath,
                content: "```%request\nGET https://example.com HTTP/1.1\n\n```",
              },
            ],
            activeFile: newPath,
          };
        }),
      saveDraftFile: (path: string, content: string) =>
        set((prev) => {
          const index = prev.draftFiles.findIndex(
            (draftFile) => draftFile.path === path,
          );
          const draftFileToEdit = prev.draftFiles[index];

          draftFileToEdit.content = content;

          const newDraftFiles = [...prev.draftFiles];

          newDraftFiles[index] = draftFileToEdit;

          return {
            ...prev,
            draftFiles: newDraftFiles,
          };
        }),
      getDraftFileContent(path) {
        return (
          get().draftFiles.find((draftFile) => draftFile.path === path)
            ?.content ?? ""
        );
      },
    }),
    { name: "reqlang-request-files" },
  ),
);
