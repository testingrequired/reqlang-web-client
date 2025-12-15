import { useMutation } from "@tanstack/react-query";
import { RequestParamsFromClient } from "reqlang-types";

export const EXPORT_KEYS = {
  export: ["export"] as const,
} as const;

export const useExportRequestMutation = () =>
  useMutation({
    mutationKey: EXPORT_KEYS.export,
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
