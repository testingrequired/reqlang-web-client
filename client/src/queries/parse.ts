import { useQuery } from "@tanstack/react-query";
import { ParseResult, ReqlangError } from "reqlang-types";
import { useGetFileQuery } from "./files";

export const PARSE_KEYS = {
  parse: (input: string | null) => ["parse", input] as const,
} as const;

export const useParsedRequestFileMutation = (requestFilePath: string) => {
  const requestFileContentQuery = useGetFileQuery(requestFilePath);

  const requestFileContent = requestFileContentQuery.data ?? null;

  return useQuery({
    enabled: !!requestFileContent,
    queryKey: PARSE_KEYS.parse(requestFileContent),
    queryFn: async () => {
      const response = await fetch(`/api/parse`, {
        method: "POST",
        body: JSON.stringify({
          payload: requestFileContent,
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
};
