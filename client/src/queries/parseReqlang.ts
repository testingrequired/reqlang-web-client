import { useMutation } from "@tanstack/react-query";
import {
  HttpResponse,
  ParseResult,
  ReqlangError,
  RequestParamsFromClient,
} from "reqlang-types";
import stripAnsi from "strip-ansi";

export const PARSE_KEYS = {
  parse: ["parse"] as const,
  run: ["run"] as const,
  export: ["export"] as const,
  diff: ["diff"] as const,
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

      const data = (await response.json()) as [HttpResponse, string];

      return data;
    },
  });

export const useExportRequest = () =>
  useMutation({
    mutationKey: PARSE_KEYS.run,
    mutationFn: async (params: RequestParamsFromClient) => {
      const response = await fetch(`/api/export_request`, {
        method: "POST",
        body: JSON.stringify(params),
        headers: {
          "content-type": "application/json",
        },
      });

      const data = (await response.text()) as string;

      return data;
    },
  });

export const useDiffResponse = () =>
  useMutation({
    mutationKey: PARSE_KEYS.run,
    mutationFn: async (responses: {
      expected: HttpResponse;
      actual: HttpResponse;
    }) => {
      const response = await fetch(`/api/diff_responses`, {
        method: "POST",
        body: JSON.stringify(responses),
        headers: {
          "content-type": "application/json",
        },
      });

      const data = await response.text();

      return stripAnsi(data);
    },
  });
