import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { RequestRun } from "server-types";

export const HISTORY_KEYS = {
  all: ["history"] as const,
  detail: (uuid: string | null) =>
    [...HISTORY_KEYS.all, "by_id", uuid] as const,
  by_request_file: (path: string | null) =>
    [...HISTORY_KEYS.all, "by_request_file", path] as const,
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

export const useGetRunHistoryForRequestQuery = (path: string | null) =>
  useQuery({
    queryKey: HISTORY_KEYS.by_request_file(path),
    queryFn: async () => {
      if (path === null) {
        return null;
      }

      const response = await fetch(`/api/history`);
      const data = (await response.json()) as RequestRun[];

      data.sort(
        (a, b) =>
          (b.request_at as unknown as number) -
          (a.request_at as unknown as number)
      );

      data.filter((run) => run.request_file_path === path);

      return data;
    },
  });

export const useGetRunHistoryByIdQuery = (uuid: string | null) =>
  useQuery({
    queryKey: HISTORY_KEYS.detail(uuid),
    queryFn: async () => {
      if (uuid === null) {
        return null;
      }

      const response = await fetch(`/api/history`);
      const data = (await response.json()) as RequestRun[];

      data.sort(
        (a, b) =>
          (b.request_at as unknown as number) -
          (a.request_at as unknown as number)
      );

      return data.find((run) => (run.uuid = uuid)) ?? null;
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
