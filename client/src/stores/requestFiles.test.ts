import { renderHook } from "@testing-library/react";
import { describe, test, expect, beforeEach } from "vitest";
import { Store, useRequestFilesStore } from "@/stores/requestFiles";
import { useStore } from "zustand";

describe("useOpenRequestFilesStore", () => {
  const fooFile = "foo";
  const barFile = "bar";

  let result: { current: Store };

  beforeEach(() => {
    ({ result } = renderHook(() => useStore(useRequestFilesStore)));
  });

  test("defaults to no open request files", () => {
    expect(result.current.openedFiles).toStrictEqual([]);
  });

  describe("openFiles", () => {
    beforeEach(() => {
      result.current.openFiles([fooFile, barFile]);
    });

    test("opens expected request files", () => {
      expect(result.current.openedFiles).toStrictEqual([fooFile, barFile]);
    });

    test("sets first open file as active", () => {
      expect(result.current.activeFile).toStrictEqual(fooFile);
    });

    describe("closeAllFiles", () => {
      beforeEach(() => {
        result.current.closeAllFiles();
      });

      test("closes all files", () => {
        expect(result.current.openedFiles).toStrictEqual([]);
      });

      test("unsets active file", () => {
        expect(result.current.activeFile).toBeNull();
      });
    });

    describe("closeFile", () => {
      describe("when active file", () => {
        beforeEach(() => {
          result.current.closeFile(fooFile);
        });

        test("leaves other files open", () => {
          expect(result.current.openedFiles).toStrictEqual([barFile]);
        });

        test("unsets active file", () => {
          expect(result.current.activeFile).toBeNull();
        });
      });

      describe("when not the active file", () => {
        beforeEach(() => {
          result.current.setActiveFile(fooFile);
          result.current.closeFile(barFile);
        });

        test("leaves active file open", () => {
          expect(result.current.openedFiles).toStrictEqual([fooFile]);
        });

        test("does not unset active file", () => {
          expect(result.current.activeFile).toBe(fooFile);
        });
      });
    });
  });
});
