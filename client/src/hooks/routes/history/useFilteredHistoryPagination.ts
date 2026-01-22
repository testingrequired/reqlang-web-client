import { useGetRunHistoryQuery } from "@/queries/history";
import { getRequestRunHistory } from "@/services/history";
import { getRouteApi } from "@tanstack/react-router";

const routeApi = getRouteApi("/history");

export function useFilteredHistoryPagination() {
  const search = routeApi.useSearch();
  const getRunHistoryQuery = useGetRunHistoryQuery();

  const selectedRequestFilePath = search.requestFilePath ?? null;
  let selectedTestResult: "pass" | "fail" | null;

  if (typeof search.testResult === "undefined") {
    selectedTestResult = null;
  } else {
    selectedTestResult = search.testResult;
  }

  return getRequestRunHistory(getRunHistoryQuery.data ?? [], {
    pagination: {
      perPage: search.limit ?? 10,
      currentPage: search.page ?? 1,
    },
    filterToPath: selectedRequestFilePath ?? undefined,
    filterByTestResult: selectedTestResult ?? undefined,
    query: search.query,
    env: search.env,
  });
}
