import { useMutation } from "@tanstack/react-query";
import { HttpResponse } from "server-types";
import stripAnsi from "strip-ansi";

export const DIFF_KEYS = {
  diff: ["diff"] as const,
} as const;

export const useDiffResponseMutation = () =>
  useMutation({
    mutationKey: DIFF_KEYS.diff,
    mutationFn: async (responses: {
      expected: HttpResponse;
      actual: HttpResponse;
    }) => {
      const response = await fetch(`/api/diff_responses`, {
        method: "POST",
        body: JSON.stringify(responses),
        headers: {
          "content-type": "application/json",
        },
      });

      const body = await response.text();

      if (!response.ok) {
        switch (response.status) {
          default:
            throw new Error(`Failed to get diff: ${body}`);
        }
      }

      return stripAnsi(body);
    },
  });
