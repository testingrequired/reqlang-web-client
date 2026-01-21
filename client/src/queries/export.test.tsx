import {
  describe,
  test,
  expect,
  vi,
  beforeAll,
  beforeEach,
  afterAll,
} from "vitest";
import { EXPORT_KEYS, useExportRequestMutation } from "@/queries/export";
import { RequestParamsFromClient } from "reqlang-types";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode } from "react";
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";
import { renderHook, waitFor } from "@testing-library/react";

describe("EXPORT_KEYS", () => {
  describe("EXPORT_KEYS", () => {
    test("equals", () => {
      const expectedPath = "expectedPath";
      const expectedParams: RequestParamsFromClient = {
        reqfile: "",
        env: null,
        vars: {},
        prompts: {},
        secrets: {},
        provider_values: {},
      };

      expect(EXPORT_KEYS.export(expectedPath, expectedParams)).toStrictEqual([
        "export",
        expectedPath,
        expectedParams,
      ]);
    });
  });
});

describe("useExportRequestQuery", () => {
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
  const server = setupServer(http.post("/api/export_request", handler));

  beforeAll(() => server.listen());

  beforeEach(() => {
    server.resetHandlers();
    handler.mockReset();
  });

  afterAll(() => server.close());

  describe("when fails", () => {
    test("returns error", async () => {
      const expectedError = "expectedError";

      handler.mockReturnValue(new HttpResponse(expectedError, { status: 500 }));

      const { result } = renderHook(
        () => useExportRequestMutation(),
        renderHookOptions,
      );

      expect(
        queryClient.getQueryData(EXPORT_KEYS.export("", expectedParams)),
      ).toBeUndefined();

      result.current.mutate(expectedParams);

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toStrictEqual(
        new Error(`Failed to get export: ${expectedError}`),
      );
    });
  });

  describe("when succeeds", () => {
    test("returns export", async () => {
      const expectedExport = "expectedExport";
      handler.mockReturnValue(
        new HttpResponse(expectedExport, { status: 200 }),
      );

      const { result } = renderHook(
        () => useExportRequestMutation(),
        renderHookOptions,
      );

      result.current.mutate(expectedParams);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toStrictEqual(expectedExport);
    });
  });
});
