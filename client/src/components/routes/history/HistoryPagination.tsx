import { useFilteredHistoryPagination } from "@/hooks/routes/history/useFilteredHistoryPagination";
import { Pagination } from "@mantine/core";
import { getRouteApi } from "@tanstack/react-router";

const routeApi = getRouteApi("/history");

export const HistoryPagination = () => {
  const nav = routeApi.useNavigate();
  const search = routeApi.useSearch();

  let selectedTestResult: "pass" | "fail" | null;

  if (typeof search.testResult === "undefined") {
    selectedTestResult = null;
  } else {
    selectedTestResult = search.testResult;
  }

  let { totalHistoryPages } = useFilteredHistoryPagination();

  return (
    <Pagination
      total={totalHistoryPages}
      value={search.page}
      onChange={(value: number) => {
        nav({
          //@ts-ignore The `data` prop is being passed "pass" & "fail" below
          search: (prev) => ({
            ...prev,
            page: value,
          }),
        });
      }}
    />
  );
};
