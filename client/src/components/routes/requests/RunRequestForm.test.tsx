import { ParseResult } from "reqlang-types";
import { beforeEach, describe, expect, it } from "vitest";
import { getFormDefaultValues } from "./RunRequestForm";

describe("getFormDefaultValues", () => {
  let parseResult: ParseResult;
  let expectedDefaultValues: Record<string, string | undefined>;

  beforeEach(() => {
    parseResult = {
      vars: [],
      envs: [],
      prompts: [],
      required_prompts: [],
      optional_prompts: [],
      default_prompt_values: {},
      secrets: [],
      // @ts-expect-error Not needed for test
      request: null,
      // @ts-expect-error Not needed for test
      full: null,
    };

    expectedDefaultValues = {
      env: undefined,
      exportRequestFormat: "http",
    };
  });

  it("should default to the first env", () => {
    expect(getFormDefaultValues(parseResult)).toStrictEqual(
      expectedDefaultValues,
    );
  });

  describe("secrets", () => {
    describe("when empty", () => {
      beforeEach(() => {
        parseResult.secrets = [];
      });

      it("should define any default secret values", () => {
        expect(getFormDefaultValues(parseResult)).toStrictEqual(
          expectedDefaultValues,
        );
      });
    });

    describe("when not empty", () => {
      beforeEach(() => {
        parseResult.secrets = ["foo", "bar"];
      });

      it("should define default secret values that are empty strings", () => {
        expect(getFormDefaultValues(parseResult)).toStrictEqual({
          ...expectedDefaultValues,
          ["secret-foo"]: "",
          ["secret-bar"]: "",
        });
      });
    });
  });

  describe("prompts", () => {
    describe("when empty", () => {
      beforeEach(() => {
        parseResult.prompts = [];
      });

      it("should define any default prompt values", () => {
        expect(getFormDefaultValues(parseResult)).toStrictEqual(
          expectedDefaultValues,
        );
      });
    });

    describe("when not empty", () => {
      beforeEach(() => {
        parseResult.prompts = ["foo", "bar"];
      });

      describe("when no default prompt values defined", () => {
        beforeEach(() => {
          parseResult.default_prompt_values = {};
        });

        it("should define default prompt values that are empty strings", () => {
          expect(getFormDefaultValues(parseResult)).toStrictEqual({
            ...expectedDefaultValues,
            ["prompt-foo"]: "",
            ["prompt-bar"]: "",
          });
        });
      });

      describe("when default prompt values are defined", () => {
        beforeEach(() => {
          parseResult.default_prompt_values = {
            foo: "apple",
            bar: "cherries",
          };
        });

        it("should define default prompt values that are empty strings", () => {
          expect(getFormDefaultValues(parseResult)).toStrictEqual({
            ...expectedDefaultValues,
            ["prompt-foo"]: "apple",
            ["prompt-bar"]: "cherries",
          });
        });
      });
    });
  });

  describe("envs", () => {
    describe("when empty", () => {
      beforeEach(() => {
        parseResult.envs = [];
      });

      it("should default env to undefined", () => {
        expect(getFormDefaultValues(parseResult)).toStrictEqual({
          ...expectedDefaultValues,
          env: undefined,
        });
      });
    });

    describe("when one env", () => {
      beforeEach(() => {
        parseResult.envs = ["test"];
      });

      it("should default env to first env", () => {
        expect(getFormDefaultValues(parseResult)).toStrictEqual({
          ...expectedDefaultValues,
          env: "test",
        });
      });
    });

    describe("when multiple envs", () => {
      beforeEach(() => {
        parseResult.envs = ["test", "prod"];
      });

      it("should default env to undefined", () => {
        expect(getFormDefaultValues(parseResult)).toStrictEqual({
          ...expectedDefaultValues,
          env: undefined,
        });
      });
    });
  });
});
