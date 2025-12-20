import { useQuery } from "@tanstack/react-query";
import { RequestParamsFromClient } from "reqlang-types";

export const EXPORT_KEYS = {
  export: (requestFilePath: string, params: RequestParamsFromClient | null) =>
    ["export", requestFilePath, params] as const,
} as const;

export const useExportRequestQuery = (
  requestFilePath: string,
  params: RequestParamsFromClient | null
) => {
  return useQuery({
    queryKey: EXPORT_KEYS.export(requestFilePath, params),
    queryFn: async () => {
      if (params === null) {
        return null;
      }

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
};
