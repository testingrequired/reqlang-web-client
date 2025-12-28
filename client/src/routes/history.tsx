import { FilesSelect } from "@/components/FileSelect";
import { RequestRunSelect } from "@/components/RequestRunSelect";
import {
  Alert,
  Button,
  ButtonGroup,
  Group,
  Loader,
  Pagination,
  Select,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { createFileRoute } from "@tanstack/react-router";
import { RequestRun } from "server-types";
import { modals } from "@mantine/modals";
import {
  useClearRunHistoryMutation,
  useGetRunHistoryQuery,
} from "@/queries/history";
import { RequestRunHistoryItemCollapsable } from "@/components/RequestRunHistoryItemCollapsable";
import { getRequestRunHistory } from "@/services/history";
import { RequestParamsFromClient } from "reqlang-types";

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
  component: RouteComponent,
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

function RouteComponent() {
  const getRunHistoryQuery = useGetRunHistoryQuery();
  const deleteHistoryMutation = useClearRunHistoryMutation();
  const search = Route.useSearch();
  const nav = Route.useNavigate();

  const openModal = () =>
    modals.openConfirmModal({
      title: "Are you sure?",
      children: (
        <Text size="sm">
          This will clear all runs from the run history and can't be undone.
        </Text>
      ),
      labels: { confirm: "Clear History", cancel: "Cancel" },
      onConfirm: () => {
        deleteHistoryMutation.mutate();
      },
    });

  const handleQueryFilter = (query: string) => {
    nav({
      to: "/history",
      replace: false,
      search: (prev) => {
        return {
          ...prev,
          query,
        };
      },
    });
  };

  const selectedRequestFilePath = search.requestFilePath ?? null;
  const selectedRequestRunInHistory = search.runId ?? null;
  let selectedTestResult: "pass" | "fail" | null;

  if (typeof search.testResult === "undefined") {
    selectedTestResult = null;
  } else {
    selectedTestResult = search.testResult;
  }

  if (getRunHistoryQuery.isError || deleteHistoryMutation.isError) {
    return <p>Error</p>;
  }

  if (getRunHistoryQuery.isPending) {
    return <Loader />;
  }

  let { requestRunHistory, totalHistoryPages, totalFilteredRequestRuns } =
    getRequestRunHistory(getRunHistoryQuery.data, {
      pagination: {
        perPage: search.limit ?? 10,
        currentPage: search.page ?? 1,
      },
      filterToPath: selectedRequestFilePath ?? undefined,
      filterByTestResult: selectedTestResult ?? undefined,
      query: search.query,
      env: search.env,
    });

  let selectedRun: RequestRun | null = null;

  if (selectedRequestRunInHistory !== null) {
    selectedRun =
      requestRunHistory.find((x) => x.uuid === selectedRequestRunInHistory) ??
      null;
  }

  const envs = [
    ...new Set(
      getRunHistoryQuery.data
        .map((item) => {
          const params: RequestParamsFromClient = JSON.parse(
            item.params_from_client_json
          );

          return params.env;
        })
        .filter((value) => value !== null)
    ),
  ];

  const historyFilters = (
    <>
      <FilesSelect
        onChange={(value) =>
          nav({
            search: (prev) => ({
              ...prev,
              requestFilePath: value ?? undefined,
            }),
          })
        }
        value={selectedRequestFilePath}
        clearable
        disabled={
          selectedRequestFilePath === null &&
          selectedRequestRunInHistory !== null
        }
      />

      <RequestRunSelect
        value={selectedRequestRunInHistory}
        onChange={(value) =>
          nav({
            search: (prev) => ({
              ...prev,
              runId: value ?? undefined,
            }),
          })
        }
        requestRunHistory={requestRunHistory}
        showPathsInSelect={selectedRequestFilePath === null}
      />

      <Select
        placeholder="Select an environment"
        value={search.env ?? null}
        onChange={(value) =>
          nav({
            search: (prev) => ({
              ...prev,
              env: value ?? undefined,
            }),
          })
        }
        data={envs}
      />

      <Group justify="space-between" grow>
        <TextInput
          placeholder="Query the request file text"
          value={search.query ?? ""}
          onChange={(e) => {
            handleQueryFilter(e.target.value);
          }}
        />
        <Select
          value={selectedTestResult}
          placeholder="Filter by test result"
          onChange={(value) =>
            nav({
              //@ts-ignore The `data` prop is being passed "pass" & "fail" below
              search: (prev) => ({
                ...prev,
                testResult: value,
              }),
            })
          }
          data={[
            { value: "pass", label: "Tests Passed" },
            { value: "fail", label: "Tests Failed" },
          ]}
        />
      </Group>
    </>
  );

  const historyButtons = (
    <Group>
      <Text mb={0}>{totalFilteredRequestRuns} total results</Text>
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

      <ButtonGroup mt={0}>
        <Button
          onClick={openModal}
          color="red"
          size="compact-sm"
          variant="outline"
          disabled={history.length === 0}
        >
          Delete History
        </Button>
      </ButtonGroup>
    </Group>
  );

  const pagination = (
    <Group justify="space-between">
      <Group>
        <Pagination
          total={totalHistoryPages}
          value={search.page}
          onChange={(value) => {
            nav({
              //@ts-ignore The `data` prop is being passed "pass" & "fail" below
              search: (prev) => ({
                ...prev,
                page: value,
              }),
            });
          }}
        />
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
      <Item selectedRun={selectedRun} />
    ) : (
      <Stack>
        {requestRunHistory.map((run) => (
          <Item key={run.uuid} selectedRun={run} />
        ))}
      </Stack>
    );

  return (
    <Stack gap="xl">
      <Title order={2} mb={0}>
        History
      </Title>

      {history.length > 0 ? (
        <>
          {historyFilters}

          {historyButtons}

          {pagination}

          {historyRunItems}

          {pagination}
        </>
      ) : (
        <Alert>No runs in history yet.</Alert>
      )}
    </Stack>
  );
}

type ItemProps = {
  selectedRun: RequestRun;
};

const Item = ({ selectedRun }: ItemProps) => {
  return <RequestRunHistoryItemCollapsable requestRun={selectedRun} />;
};
