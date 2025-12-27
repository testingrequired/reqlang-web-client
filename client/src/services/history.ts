import { RequestParamsFromClient } from "reqlang-types";
import { RequestRun } from "server-types";

type GetHistoryOptions = {
  query?: string;
  filterToPath?: string;
  filterByTestResult?: "pass" | "fail";
  sortBy?: (a: RequestRun, b: RequestRun) => number;
  pagination?: {
    perPage: number;
    currentPage: number;
  };
};

type GetHistoryReturn = {
  requestRunHistory: RequestRun[];
  totalHistoryPages: number;
  totalFilteredRequestRuns: number;
};

export function getRequestRunHistory(
  allHistory: RequestRun[],
  options: GetHistoryOptions = {
    sortBy: (a: RequestRun, b: RequestRun) =>
      (b.request_at as unknown as number) - (a.request_at as unknown as number),
  }
): GetHistoryReturn {
  let history =
    typeof options.filterToPath === "undefined"
      ? allHistory
      : allHistory.filter(
          (run) => run.request_file_path === options.filterToPath
        );

  history.sort(options.sortBy);

  if (typeof options.filterByTestResult !== "undefined") {
    history = history.filter(
      (item) => item.pass === (options.filterByTestResult === "pass")
    );
  }

  if (typeof options.query === "string") {
    history = history.filter((item) => {
      const params: RequestParamsFromClient = JSON.parse(
        item.params_from_client_json
      );

      return params.reqfile.includes(options.query as string);
    });
  }

  const perPage = options.pagination?.perPage ?? history.length;
  const currentPage = options.pagination?.currentPage ?? 1;

  const historyChunks = chunk(history, perPage);

  if (historyChunks.length === 0) {
    return {
      requestRunHistory: [],
      totalHistoryPages: 0,
      totalFilteredRequestRuns: history.length,
    };
  }

  const historyChunk = historyChunks[currentPage - 1];

  return {
    requestRunHistory: historyChunk,
    totalHistoryPages: historyChunks.length,
    totalFilteredRequestRuns: history.length,
  };
}

function chunk<T>(array: T[], size: number = array.length): T[][] {
  if (!array.length) {
    return [];
  }
  const head = array.slice(0, size);
  const tail = array.slice(size);
  return [head, ...chunk(tail, size)];
}
