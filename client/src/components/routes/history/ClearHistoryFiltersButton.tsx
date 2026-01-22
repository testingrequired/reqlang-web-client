import { Button } from "@mantine/core";
import { getRouteApi } from "@tanstack/react-router";

const routeApi = getRouteApi("/history");

export const ClearHistoryFiltersButton = () => {
  const nav = routeApi.useNavigate();
  const search = routeApi.useSearch();

  const selectedRequestFilePath = search.requestFilePath ?? null;
  const selectedRequestRunInHistory = search.runId ?? null;

  let selectedTestResult: "pass" | "fail" | null;

  if (typeof search.testResult === "undefined") {
    selectedTestResult = null;
  } else {
    selectedTestResult = search.testResult;
  }

  return (
    <Button
      disabled={
        selectedRequestFilePath === null &&
        selectedRequestRunInHistory === null &&
        selectedTestResult === null &&
        (!search.query || search.query.length === 0) &&
        typeof search.env === "undefined"
      }
      onClick={() =>
        nav({
          search: {},
        })
      }
      size="compact-sm"
    >
      Clear Filters
    </Button>
  );
};
