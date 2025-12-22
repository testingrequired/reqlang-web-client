import { FilesSelect } from "@/components/FileSelect";
import { RequestRunSelect } from "@/components/RequestRunSelect";
import {
  Alert,
  Button,
  ButtonGroup,
  Group,
  Loader,
  Select,
  Stack,
  Text,
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

type Search = {
  runId?: string;
  requestFilePath?: string;
  testResult?: "pass" | "fail";
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
    };
  },
});

function RouteComponent() {
  const getRunHistoryQuery = useGetRunHistoryQuery();
  const deleteHistoryMutation = useClearRunHistoryMutation();
  const search = Route.useSearch();
  const nav = Route.useNavigate();

  const selectedRequestFilePath = search.requestFilePath ?? null;
  const selectedRequestRunInHistory = search.runId ?? null;
  let selectedTestResult: "pass" | "fail" | null;

  if (typeof search.testResult === "undefined") {
    selectedTestResult = null;
  } else {
    selectedTestResult = search.testResult;
  }

  debugger;

  if (getRunHistoryQuery.isError || deleteHistoryMutation.isError) {
    return <p>Error</p>;
  }

  if (getRunHistoryQuery.isPending) {
    return <Loader />;
  }

  let allHistory = getRunHistoryQuery.data;
  let selectedRequestHistory = allHistory.filter(
    (run) => run.request_file_path === selectedRequestFilePath
  );

  let history =
    selectedRequestFilePath === null ? allHistory : selectedRequestHistory;

  history.sort(
    (a, b) =>
      (b.request_at as unknown as number) - (a.request_at as unknown as number)
  );

  if (typeof search.testResult !== "undefined") {
    history = history.filter(
      (item) => item.pass === (search.testResult === "pass")
    );
  }

  let selectedRun: RequestRun | null = null;

  if (selectedRequestRunInHistory !== null) {
    selectedRun =
      history.find((x) => x.uuid === selectedRequestRunInHistory) ?? null;
  }

  const historyOrItem =
    selectedRun !== null ? (
      <Item selectedRun={selectedRun} />
    ) : (
      <Stack>
        {history.map((run) => (
          <Item key={run.uuid} selectedRun={run} />
        ))}
      </Stack>
    );

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

  return (
    <Stack gap="xl">
      <Title order={2} mb={0}>
        History
      </Title>

      {allHistory.length > 0 ? (
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
            requestRunHistory={history}
            showPathsInSelect={selectedRequestFilePath === null}
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
              { value: "pass", label: "Test Passed" },
              { value: "fail", label: "Test Failed" },
            ]}
          />

          <Group>
            <Button
              disabled={
                selectedRequestFilePath === null &&
                selectedRequestRunInHistory === null &&
                selectedTestResult === null
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

          {historyOrItem}
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
