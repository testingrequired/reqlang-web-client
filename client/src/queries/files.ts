import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { UpdateRequestFileBody } from "server-types";

export const FILES_KEYS = {
  all: ["files"] as const,
  detail: (path: string | null) => [...FILES_KEYS.all, "file", path] as const,
} as const;

export const useGetFilesQuery = () =>
  useQuery({
    queryKey: FILES_KEYS.all,
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
    queryKey: FILES_KEYS.detail(path),
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

export const useUpdateFileMutation = (path: string | null) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (body: UpdateRequestFileBody) => {
      if (path === null) {
        return null;
      }

      const response = await fetch(`/api/files/${path}`, {
        method: "PATCH",
        body: JSON.stringify(body),
        headers: {
          "content-type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`There was an issue fetching file: ${path}`);
      }

      const data = await response.text();

      return data;
    },
    onSuccess() {
      queryClient.invalidateQueries({
        queryKey: FILES_KEYS.detail(path),
      });
    },
  });
};
