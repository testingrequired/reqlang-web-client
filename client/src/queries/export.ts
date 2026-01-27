import { useMutation } from "@tanstack/react-query";
import { RequestParamsFromClient } from "reqlang-types";

export const EXPORT_KEYS = {
  export: (requestFilePath: string, params: RequestParamsFromClient | null) =>
    ["export", requestFilePath, params] as const,
} as const;

type ExportRequestArgs = {
  params: RequestParamsFromClient;
  format?: string;
};

export const useExportRequestMutation = () => {
  return useMutation({
    mutationFn: async (args: ExportRequestArgs) => {
      const response = await fetch(
        `/api/export_request?format=${args.format ?? "http"}`,
        {
          method: "POST",
          body: JSON.stringify(args.params),
          headers: {
            "content-type": "application/json",
          },
        },
      );

      const body = await response.text();

      if (!response.ok) {
        switch (response.status) {
          default:
            throw new Error(`Failed to get export: ${body}`);
        }
      }

      return body;
    },
  });
};
