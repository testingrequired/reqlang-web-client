import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { RequestRun } from "server-types";

export const HISTORY_KEYS = {
  all: ["history"] as const,
} as const;

export const useGetRunHistoryQuery = () =>
  useQuery({
    queryKey: HISTORY_KEYS.all,
    queryFn: async () => {
      const response = await fetch(`/api/history`);
      const data = (await response.json()) as RequestRun[];

      data.sort(
        (a, b) =>
          (b.request_at as unknown as number) -
          (a.request_at as unknown as number)
      );

      return data;
    },
  });

export const useClearRunHistoryMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: HISTORY_KEYS.all,
    mutationFn: async () => {
      await fetch(`/api/history`, {
        method: "DELETE",
      });
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({
        queryKey: HISTORY_KEYS.all,
      });
    },
  });
};
