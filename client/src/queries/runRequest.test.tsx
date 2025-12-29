import {
  describe,
  test,
  expect,
  vi,
  beforeAll,
  beforeEach,
  afterAll,
} from "vitest";
import { RUN_REQUEST_KEYS, useRunRequestMutation } from "@/queries/runRequest";
import { RequestParamsFromClient } from "reqlang-types";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode } from "react";
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";
import { renderHook, waitFor } from "@testing-library/react";
import { RequestRunResponse, RunRequest } from "server-types";

describe("RUN_REQUEST_KEYS", () => {
  describe("run", () => {
    test("equals", () => {
      expect(RUN_REQUEST_KEYS.run).toStrictEqual(["run"]);
    });
  });
});

describe("useRunRequestMutation", () => {
  const expectedPath = "expectedPath";
  const expectedParams: RequestParamsFromClient = {
    reqfile: expectedPath,
    env: null,
    vars: {},
    prompts: {},
    secrets: {},
    provider_values: {},
  };

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
  const server = setupServer(http.post("/api/run", handler));

  beforeAll(() => server.listen());

  beforeEach(() => {
    server.resetHandlers();
    handler.mockReset();
  });

  afterAll(() => server.close());

  describe("when fails", () => {
    test("returns error", async () => {
      const expectedError = "expectedError";

      handler.mockReturnValue(
        new HttpResponse(JSON.stringify({ error: expectedError }), {
          status: 500,
        })
      );

      const { result } = renderHook(
        () => useRunRequestMutation(),
        renderHookOptions
      );

      expect(queryClient.getQueryData(RUN_REQUEST_KEYS.run)).toBeUndefined();

      result.current.mutate({
        request_file_path: expectedPath,
        params: expectedParams,
      } as RunRequest);

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(queryClient.getQueryData(RUN_REQUEST_KEYS.run)).toBeUndefined();

      expect(result.current.error).toStrictEqual(new Error(expectedError));
    });
  });

  describe("when succeeds", () => {
    test("returns request run response and exported response string", async () => {
      const expectedResponseBody: [RequestRunResponse, string] = [
        {
          response: {
            http_version: "1.1",
            status_code: 200,
            status_text: "OK",
            headers: [],
            body: "",
          },
          time_taken: 110 as unknown as bigint,
          test_result: {
            pass: true,
            diff: "",
          },
        },
        "expectedExportedResponseString",
      ];

      handler.mockReturnValue(
        new HttpResponse(JSON.stringify(expectedResponseBody), { status: 200 })
      );

      const { result } = renderHook(
        () => useRunRequestMutation(),
        renderHookOptions
      );

      expect(queryClient.getQueryData(RUN_REQUEST_KEYS.run)).toBeUndefined();

      result.current.mutate({
        request_file_path: expectedPath,
        params: expectedParams,
      } as RunRequest);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toStrictEqual(expectedResponseBody);
    });
  });
});
