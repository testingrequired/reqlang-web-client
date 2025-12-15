import { useMutation, useQueryClient } from "@tanstack/react-query";
import { RequestRunResponse, RunRequest } from "server-types";
import { HISTORY_KEYS } from "./history";

export const RUN_REQUEST_KEYS = {
  run: ["run"] as const,
} as const;

export const useRunRequestMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: RUN_REQUEST_KEYS.run,
    mutationFn: async (params: RunRequest) => {
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
    onSuccess: async () => {
      queryClient.invalidateQueries({
        queryKey: HISTORY_KEYS.all,
      });
    },
  });
};
