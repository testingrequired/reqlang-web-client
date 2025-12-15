import { FilesSelect } from "@/components/FileSelect";
import { RequestRunSelect } from "@/components/RequestRunSelect";
import {
  useClearRunHistoryMutation,
  useGetRunHistoryQuery,
} from "@/queries/parseReqlang";
import {
  Alert,
  Button,
  ButtonGroup,
  Card,
  Code,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { createFileRoute } from "@tanstack/react-router";
import moment from "moment";
import { useState } from "react";
import { RequestRun } from "server-types";
import { modals } from "@mantine/modals";

export const Route = createFileRoute("/history")({
  component: RouteComponent,
});

function RouteComponent() {
  const getRunHistoryQuery = useGetRunHistoryQuery();
  const deleteHistoryMutation = useClearRunHistoryMutation();
  const [selectedRequestFilePath, setSelectedRequestFilePath] = useState<
    string | null
  >(null);
  const [selectedRequestRunInHistory, setSelectedREquestRunInHistory] =
    useState<number | null>(null);

  if (getRunHistoryQuery.isError || deleteHistoryMutation.isError) {
    return <p>Error</p>;
  }

  if (getRunHistoryQuery.isPending) {
    return <p>Loading...</p>;
  }

  let allHistory = getRunHistoryQuery.data;
  let selectedRequestHistory = allHistory.filter(
    (run) => run.request_file_path === selectedRequestFilePath
  );

  const history =
    selectedRequestFilePath === null ? allHistory : selectedRequestHistory;

  history.sort(
    (a, b) =>
      (b.request_at as unknown as number) - (a.request_at as unknown as number)
  );

  let selectedRun: RequestRun | null = null;

  if (selectedRequestRunInHistory !== null) {
    selectedRun = history[selectedRequestRunInHistory];
  }

  const historyOrItem =
    selectedRun !== null ? (
      <Item selectedRun={selectedRun} />
    ) : (
      history.map((run) => <Item selectedRun={run} />)
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
      <Title order={2}>History</Title>

      {allHistory.length > 0 ? (
        <>
          <FilesSelect
            onChange={setSelectedRequestFilePath}
            value={selectedRequestFilePath}
            clearable
            disabled={
              selectedRequestFilePath === null &&
              selectedRequestRunInHistory !== null
            }
          />

          <RequestRunSelect
            value={selectedRequestRunInHistory}
            onChange={setSelectedREquestRunInHistory}
            requestRunHistory={history}
            showPathsInSelect={selectedRequestFilePath === null}
          />

          <ButtonGroup>
            <Button
              disabled={
                selectedRequestFilePath === null &&
                selectedRequestRunInHistory === null
              }
              onClick={() => {
                setSelectedRequestFilePath(null);
                setSelectedREquestRunInHistory(null);
              }}
            >
              Clear Filters
            </Button>
            <Button
              onClick={openModal}
              color="red"
              disabled={history.length === 0}
            >
              Clear All Runs
            </Button>
          </ButtonGroup>

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
  return (
    <Stack gap="xs">
      <Text size="md" m={0}>
        {selectedRun.request_file_path} (
        {moment(selectedRun.request_at as unknown as number).fromNow()})
      </Text>

      <Card>
        <Text size="md" m={0}>
          Params
        </Text>
        <Code block style={{ maxWidth: "100%" }}>
          {selectedRun.params_from_client_json}
        </Code>
      </Card>

      <Card>
        <Text size="md" m={0}>
          Response
        </Text>
        <Code block style={{ maxWidth: "100%" }}>
          {selectedRun.response}
        </Code>
      </Card>
    </Stack>
  );
};
