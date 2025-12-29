import { describe, test, expect } from "vitest";
import { HISTORY_KEYS } from "@/queries/history";

describe("HISTORY_KEYS", () => {
  describe("all", () => {
    test("equals", () => {
      expect(HISTORY_KEYS.all).toStrictEqual(["history"]);
    });
  });

  describe("detail", () => {
    test("equals", () => {
      const expectedKey = "expectedKey";

      expect(HISTORY_KEYS.detail(expectedKey)).toStrictEqual([
        "history",
        "by_id",
        expectedKey,
      ]);
    });
  });

  describe("by_request_file", () => {
    test("equals", () => {
      const expectedKey = "expectedKey";

      expect(HISTORY_KEYS.by_request_file(expectedKey)).toStrictEqual([
        "history",
        "by_request_file",
        expectedKey,
      ]);
    });
  });
});
