import { createStore } from "zustand";
import { persist } from "zustand/middleware";
import { v4 as uuid } from "uuid";
import { HttpRequest, HttpResponse } from "reqlang-types";

export const DFAULT_REQUEST = {
  verb: "GET",
  target: "https://example.com",
  http_version: "1.1",
  headers: [],
  body: null,
};

export const DFAULT_RESPONSE: HttpResponse = {
  http_version: "1.1",
  status_code: 200,
  status_text: "OK",
  headers: [],
  body: null,
};

export type DraftFile = {
  path: string;
  request: HttpRequest;
  response: HttpResponse | null;
  config: string;
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
  saveDraftFile(path: string, content: DraftFile): void;
  getDraftFileContent(path: string): DraftFile | null;
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
                request: DFAULT_REQUEST,
                response: null,
                config: "",
              },
            ],
            activeFile: newPath,
          };
        }),
      saveDraftFile: (path: string, content: DraftFile) =>
        set((prev) => {
          const index = prev.draftFiles.findIndex(
            (draftFile) => draftFile.path === path,
          );

          prev.draftFiles[index] = content;

          return prev;
        }),
      getDraftFileContent(path) {
        return (
          get().draftFiles.find((draftFile) => draftFile.path === path) ?? null
        );
      },
    }),
    { name: "reqlang-request-files" },
  ),
);
