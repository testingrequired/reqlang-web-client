import { describe, test, expect } from "vitest";
import { FILES_KEYS } from "@/queries/files";

describe("FILES_KEY", () => {
  describe("all", () => {
    test("equals", () => {
      expect(FILES_KEYS.all).toStrictEqual(["files"]);
    });
  });

  describe("detail", () => {
    test("equals", () => {
      const expectedPath = "expectedPath";

      expect(FILES_KEYS.detail(expectedPath)).toStrictEqual([
        "files",
        "file",
        expectedPath,
      ]);
    });
  });
});
