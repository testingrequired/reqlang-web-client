import { createFileRoute } from "@tanstack/react-router";
import { HistoryRoute } from "@/components/routes/history/HistoryRoute";

type Search = {
  runId?: string;
  requestFilePath?: string;
  testResult?: "pass" | "fail";
  env?: string;
  limit?: number;
  page?: number;
  query?: string;
};

export const Route = createFileRoute("/history")({
  component: HistoryRoute,
  validateSearch: (search): Search => {
    let testResult: "pass" | "fail" | undefined;

    if (typeof search.testResult === "string") {
      if (search.testResult === "pass" || search.testResult === "fail") {
        testResult = search.testResult;
      }
    }

    return {
      runId: typeof search.runId === "string" ? search.runId : undefined,
      requestFilePath:
        typeof search.requestFilePath === "string"
          ? search.requestFilePath
          : undefined,
      testResult,
      env: typeof search.env === "string" ? search.env : undefined,
      limit: typeof search.limit === "number" ? search.limit : 10,
      page: typeof search.page === "number" ? search.page : 1,
      query: typeof search.query === "string" ? search.query : undefined,
    };
  },
});
