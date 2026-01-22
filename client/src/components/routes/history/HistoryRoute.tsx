import { useFilteredHistoryPagination } from "@/hooks/routes/history/useFilteredHistoryPagination";
import { useGetRunHistoryQuery } from "@/queries/history";
import {
  Alert,
  Group,
  Loader,
  Select,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { getRouteApi } from "@tanstack/react-router";
import { RequestRun } from "server-types";
import { HistoryPagination } from "./HistoryPagination";
import { RequestRunHistoryItemCollapsable } from "@/components/common/RequestRunHistoryItemCollapsable";
import { FilesSelectFilter } from "./FilesSelectFilter";
import { RequestRunSelectFilter } from "./RequestRunSelectFilter";
import { EnvFilter } from "./EnvFilter";
import { QuerySearchFilter } from "./QuerySearchFilter";
import { TestResultFilter } from "./TestResultsFilter";
import { ClearHistoryFiltersButton } from "./ClearHistoryFiltersButton";
import { DeleteHistoryButton } from "./DeleteHistoryButton";

export const routeApi = getRouteApi("/history");

export function HistoryRoute() {
  const getRunHistoryQuery = useGetRunHistoryQuery();
  const search = routeApi.useSearch();
  const nav = routeApi.useNavigate();

  let { requestRunHistory, totalFilteredRequestRuns } =
    useFilteredHistoryPagination();

  const selectedRequestRunInHistory = search.runId ?? null;

  if (getRunHistoryQuery.isError) {
    return <p>Error</p>;
  }

  if (getRunHistoryQuery.isPending) {
    return <Loader />;
  }

  let selectedRun: RequestRun | null = null;

  if (selectedRequestRunInHistory !== null) {
    selectedRun =
      requestRunHistory.find((x) => x.uuid === selectedRequestRunInHistory) ??
      null;
  }

  const pagination = requestRunHistory.length >= 10 && (
    <Group justify="space-between">
      <Group>
        <HistoryPagination />
      </Group>

      <Select
        value={search.limit?.toString(10) ?? null}
        placeholder="Limit number of results"
        onChange={(value) =>
          nav({
            //@ts-ignore
            search: (prev) => ({
              ...prev,
              limit: value === null ? null : parseInt(value, 10),
            }),
          })
        }
        data={[
          { value: "10", label: "10 results" },
          { value: "25", label: "25 results" },
          { value: "50", label: "50 results" },
          { value: "100", label: "100 results" },
        ]}
      />
    </Group>
  );

  const historyRunItems =
    selectedRun !== null ? (
      <RequestRunHistoryItemCollapsable requestRun={selectedRun} />
    ) : (
      <Stack gap="xs">
        {requestRunHistory.map((run) => (
          <RequestRunHistoryItemCollapsable key={run.uuid} requestRun={run} />
        ))}
      </Stack>
    );

  return (
    <Stack gap="lg">
      <Title order={2} mb={0}>
        History
      </Title>

      <>
        <FilesSelectFilter />

        <RequestRunSelectFilter history={requestRunHistory} />

        <EnvFilter history={requestRunHistory} />

        <Group justify="space-between" grow>
          <QuerySearchFilter />

          <TestResultFilter />
        </Group>

        <Group>
          <ClearHistoryFiltersButton />

          <DeleteHistoryButton />
        </Group>

        {requestRunHistory.length > 0 ? (
          <>
            <Text mb={0} size="sm">
              {totalFilteredRequestRuns} total results
            </Text>

            <Stack mt="lg">
              {pagination}

              {historyRunItems}

              {pagination}
            </Stack>
          </>
        ) : (
          <Alert>No runs in history yet.</Alert>
        )}
      </>
    </Stack>
  );
}
