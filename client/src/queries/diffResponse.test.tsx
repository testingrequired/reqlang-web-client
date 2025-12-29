import {
  describe,
  test,
  expect,
  vi,
  beforeAll,
  beforeEach,
  afterAll,
} from "vitest";
import { DIFF_KEYS, useDiffResponseMutation } from "@/queries/diffResponse";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode } from "react";
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";
import { renderHook, waitFor } from "@testing-library/react";
import { HttpResponse as ReqlangHttpResponse } from "reqlang-types";

describe("DIFF_KEYS", () => {
  describe("diff", () => {
    test("equals", () => {
      expect(DIFF_KEYS.diff).toStrictEqual(["diff"]);
    });
  });
});

describe("useDiffResponseMutation", () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  const renderHookOptions = { wrapper };

  const handler = vi.fn();
  const server = setupServer(http.post("/api/diff_responses", handler));

  beforeAll(() => server.listen());

  beforeEach(() => {
    server.resetHandlers();
    handler.mockReset();
  });

  afterAll(() => server.close());

  const expectedResponse: ReqlangHttpResponse = {
    http_version: "1.1",
    status_code: 200,
    status_text: "OK",
    headers: [],
    body: null,
  };

  const actualResponse: ReqlangHttpResponse = {
    http_version: "1.1",
    status_code: 200,
    status_text: "OK",
    headers: [],
    body: null,
  };

  describe("when fails", () => {
    test("returns error", async () => {
      const expectedError = "expectedError";

      handler.mockReturnValue(new HttpResponse(expectedError, { status: 500 }));

      const { result } = renderHook(
        () => useDiffResponseMutation(),
        renderHookOptions
      );

      expect(queryClient.getQueryData(DIFF_KEYS.diff)).toBeUndefined();

      result.current.mutate({
        expected: expectedResponse,
        actual: actualResponse,
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toStrictEqual(
        new Error(`Failed to get diff: ${expectedError}`)
      );
    });
  });

  describe("when succeeds", () => {
    test("returns diffs as a string", async () => {
      const expectedDiffs = "expectedDiffs";
      handler.mockReturnValue(new HttpResponse(expectedDiffs, { status: 200 }));

      const { result } = renderHook(
        () => useDiffResponseMutation(),
        renderHookOptions
      );

      expect(queryClient.getQueryData(DIFF_KEYS.diff)).toBeUndefined();

      result.current.mutate({
        expected: expectedResponse,
        actual: actualResponse,
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toStrictEqual(expectedDiffs);
    });
  });
});
