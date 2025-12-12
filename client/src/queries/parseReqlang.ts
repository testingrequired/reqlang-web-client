import { useMutation, useQuery } from "@tanstack/react-query";
import {
  HttpResponse,
  ParseResult,
  ReqlangError,
  RequestParamsFromClient,
} from "reqlang-types";
import { RequestRunResponse } from "server-types";
import stripAnsi from "strip-ansi";

export const PARSE_KEYS = {
  parse: ["parse"] as const,
  run: ["run"] as const,
  export: ["export"] as const,
  diff: ["diff"] as const,
  files: ["files"] as const,
  file: (path: string | null) => ["files", path] as const,
} as const;

export const useGetFilesQuery = () =>
  useQuery({
    queryKey: PARSE_KEYS.files,
    queryFn: async () => {
      const response = await fetch(`/api/files`, {
        method: "GET",
      });

      if (!response.ok) {
        throw new Error(`There was an issue fetching files list`);
      }

      const data = (await response.json()) as unknown as string[];

      return data;
    },
  });

export const useGetFileQuery = (path: string | null) =>
  useQuery({
    queryKey: PARSE_KEYS.file(path),
    queryFn: async () => {
      if (path === null) {
        return null;
      }

      const response = await fetch(`/api/files/${path}`, {
        method: "GET",
      });

      if (!response.ok) {
        throw new Error(`There was an issue fetching file: ${path}`);
      }

      const data = await response.text();

      return data;
    },
  });

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

      const data = (await response.json()) as [RequestRunResponse, string];

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
