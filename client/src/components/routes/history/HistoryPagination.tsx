import { useFilteredHistoryPagination } from "@/hooks/routes/history/useFilteredHistoryPagination";
import { Pagination } from "@mantine/core";
import { routeApi } from "@/components/routes/history/HistoryRoute";

export const HistoryPagination = () => {
  const nav = routeApi.useNavigate();
  const search = routeApi.useSearch();

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
