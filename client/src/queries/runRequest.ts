import { useMutation, useQueryClient } from "@tanstack/react-query";
import { RequestRunResponse, RunRequest } from "server-types";
import { HISTORY_KEYS } from "./history";
import stripAnsi from "strip-ansi";

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

      if (response.status === 500) {
        const err = (await response.json()) as { error: string };

        throw new Error(err.error);
      }

      const data = (await response.json()) as [RequestRunResponse, string];

      data[0].test_result.diff = stripAnsi(data[0].test_result.diff ?? "");

      return data;
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({
        queryKey: HISTORY_KEYS.all,
      });
    },
  });
};
