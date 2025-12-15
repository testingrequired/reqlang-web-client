import { FilesSelect } from "@/components/FileSelect";
import { RequestRunSelect } from "@/components/RequestRunSelect";
import {
  useClearRunHistoryMutation,
  useGetRunHistoryQuery,
} from "@/queries/parseReqlang";
import { Button, Card, Code, Stack, Text, Title } from "@mantine/core";
import { createFileRoute } from "@tanstack/react-router";
import moment from "moment";
import { useState } from "react";
import { RequestRun } from "server-types";

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

  return (
    <Stack gap="xl">
      <Title order={2}>History</Title>

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

      <Button onClick={() => deleteHistoryMutation.mutate()}>
        Clear History
      </Button>

      {historyOrItem}
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
