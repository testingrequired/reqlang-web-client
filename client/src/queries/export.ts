import { useMutation } from "@tanstack/react-query";
import { RequestParamsFromClient } from "reqlang-types";

export const EXPORT_KEYS = {
  export: (requestFilePath: string, params: RequestParamsFromClient | null) =>
    ["export", requestFilePath, params] as const,
} as const;

export const useExportRequestMutation = () => {
  return useMutation({
    mutationFn: async (params: RequestParamsFromClient) => {
      const response = await fetch(`/api/export_request`, {
        method: "POST",
        body: JSON.stringify(params),
        headers: {
          "content-type": "application/json",
        },
      });

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
