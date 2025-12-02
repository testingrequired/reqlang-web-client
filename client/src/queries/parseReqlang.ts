import { useMutation } from "@tanstack/react-query";
import { ParseResult } from "reqlang-types";

export const PARSE_KEYS = {
  parse: ["parse"] as const,
} as const;

export const useParsedRequestFileQuery = () =>
  useMutation({
    mutationKey: PARSE_KEYS.parse,
    mutationFn: async (input: string) => {
      debugger;
      const response = await fetch(`/api/parse`, {
        method: "POST",
        body: JSON.stringify({
          payload: input,
        }),
        headers: {
          "content-type": "application/json",
        },
      });
      const data = (await response.json()) as ParseResult;

      return data;
    },
  });
