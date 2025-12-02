import { useMutation } from "@tanstack/react-query";
import {
  HttpResponse,
  ParseResult,
  RequestParamsFromClient,
} from "reqlang-types";

export const PARSE_KEYS = {
  parse: ["parse"] as const,
  run: ["run"] as const,
} as const;

export const useParsedRequestFileQuery = () =>
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
      const data = (await response.json()) as ParseResult;

      return data;
    },
  });

export const useRunRequest = () =>
  useMutation({
    mutationKey: PARSE_KEYS.run,
    mutationFn: async (params: RequestParamsFromClient) => {
      const response = await fetch(`/api/run`, {
        method: "POST",
        body: JSON.stringify(params),
        headers: {
          "content-type": "application/json",
        },
      });
      const data = (await response.json()) as HttpResponse;

      return data;
    },
  });
