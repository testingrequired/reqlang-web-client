import { describe, test, expect } from "vitest";
import { PARSE_KEYS } from "@/queries/parse";

describe("PARSE_KEYS", () => {
  describe("parse", () => {
    test("equals", () => {
      const expectedKey = "expectedKey";

      expect(PARSE_KEYS.parse(expectedKey)).toStrictEqual([
        "parse",
        expectedKey,
      ]);
    });
  });
});
