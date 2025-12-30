import { renderHook } from "@testing-library/react";
import { describe, test, expect, beforeEach } from "vitest";
import { Store, useOpenRequestFilesStore } from "./selectedRequestFile";
import { useStore } from "zustand";

describe("useOpenRequestFilesStore", () => {
  const fooFile = "foo";
  const barFile = "bar";

  let result: { current: Store };

  beforeEach(() => {
    ({ result } = renderHook(() => useStore(useOpenRequestFilesStore)));
  });

  test("openRequestFiles defaults to empty array", () => {
    expect(result.current.openRequestFiles).toStrictEqual([]);
  });

  describe("open", () => {
    beforeEach(() => {
      result.current.setOpenRequestFiles([fooFile, barFile]);
    });

    test("openRequestFiles is equal to opened files", () => {
      expect(result.current.openRequestFiles).toStrictEqual([fooFile, barFile]);
    });

    test("selectedRequestFile is equal to first open file", () => {
      expect(result.current.selectedRequestFile).toStrictEqual(fooFile);
    });

    describe("close all", () => {
      beforeEach(() => {
        result.current.setOpenRequestFiles([]);
      });

      test("openRequestFiles is equal to remaining files", () => {
        expect(result.current.openRequestFiles).toStrictEqual([]);
      });

      test("selectedRequestFile is null", () => {
        expect(result.current.selectedRequestFile).toBeNull();
      });
    });

    describe("close", () => {
      describe("the current selected file", () => {
        beforeEach(() => {
          result.current.closeRequestfile(fooFile);
        });

        test("openRequestFiles is equal to remaining files", () => {
          expect(result.current.openRequestFiles).toStrictEqual([barFile]);
        });

        test("selectedRequestFile is null", () => {
          expect(result.current.selectedRequestFile).toBeNull();
        });
      });

      describe("not the current selected file", () => {
        beforeEach(() => {
          result.current.setSelectedRequestFile(fooFile);
          result.current.closeRequestfile(barFile);
        });

        test("openRequestFiles is equal to remaining files", () => {
          expect(result.current.openRequestFiles).toStrictEqual([fooFile]);
        });

        test("selectedRequestFile is the same", () => {
          expect(result.current.selectedRequestFile).toBe(fooFile);
        });
      });
    });
  });
});
