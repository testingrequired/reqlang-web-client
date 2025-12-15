import { FilesSelect } from "@/components/FileSelect";
import { RequestRunSelect } from "@/components/RequestRunSelect";
import {
  Alert,
  Badge,
  Button,
  ButtonGroup,
  Card,
  Group,
  Loader,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { RequestRun } from "server-types";
import { modals } from "@mantine/modals";
import {
  useClearRunHistoryMutation,
  useGetRunHistoryQuery,
} from "@/queries/history";
import { RequestRunHistoryItem } from "@/components/RequestRunHistoryItem";
import moment from "moment";

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
    useState<string | null>(null);

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

  const history =
    selectedRequestFilePath === null ? allHistory : selectedRequestHistory;

  history.sort(
    (a, b) =>
      (b.request_at as unknown as number) - (a.request_at as unknown as number)
  );

  let selectedRun: RequestRun | null = null;

  if (selectedRequestRunInHistory !== null) {
    selectedRun =
      history.find((x) => x.uuid === selectedRequestRunInHistory) ?? null;
  }

  const historyOrItem =
    selectedRun !== null ? (
      <Item selectedRun={selectedRun} />
    ) : (
      history.map((run) => <Item key={run.uuid} selectedRun={run} />)
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

          <Group>
            <Button
              disabled={
                selectedRequestFilePath === null &&
                selectedRequestRunInHistory === null
              }
              onClick={() => {
                setSelectedRequestFilePath(null);
                setSelectedREquestRunInHistory(null);
              }}
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
  return (
    <Card>
      <Group mb="md">
        <Badge variant="transparent" color="white">
          {moment(selectedRun.request_at as unknown as number).fromNow()}
        </Badge>
        <Badge variant="transparent" color="white">
          {selectedRun.request_file_path}
        </Badge>
        <Badge radius="lg" variant="transparent" color="dark">
          {selectedRun.uuid.slice(0, 8)}
        </Badge>
        <Text size="md" m={0}></Text>
      </Group>

      <Card>
        <RequestRunHistoryItem requestRun={selectedRun} />
      </Card>
    </Card>
  );
};
