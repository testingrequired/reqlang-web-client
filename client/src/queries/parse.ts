import { useMutation } from "@tanstack/react-query";
import { ParseResult, ReqlangError } from "reqlang-types";

export const PARSE_KEYS = {
  parse: ["parse"] as const,
} as const;

export const useParsedRequestFileMutation = () =>
  useMutation({
    mutationKey: PARSE_KEYS.parse,
    mutationFn: async (input: string) => {
      const response = await fetch(`/api/parse`, {
        method: "POST",
        body: JSON.stringify({
          payload: input,
        }),
        headers: {
          "content-type": "application/json",
        },
      });

      if (!response.ok) {
        if (response.status === 400) {
          const errs = (await response.json()) as [
            ReqlangError,
            { start: number; end: number },
          ][];

          throw new Error("Unable to parse request file", {
            cause: errs,
          });
        }
      }

      const data = (await response.json()) as ParseResult;

      return data;
    },
  });
