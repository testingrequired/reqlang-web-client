import { Alert, Anchor, Card, Stack, Text } from "@mantine/core";
import { useState } from "react";
import { RequestRunHistoryItem } from "./RequestRunHistoryItem";
import { RequestRunSelect } from "./RequestRunSelect";
import { useGetRunHistoryForRequestQuery } from "@/queries/history";
import { Link } from "@tanstack/react-router";

type Props = {
  requestFilePath: string | null;
};

export const RequestRunHistory: React.FC<Props> = ({ requestFilePath }) => {
  const [runId, setRunId] = useState<string | null>(null);
  const runHistoryQuery = useGetRunHistoryForRequestQuery(requestFilePath);

  if (runHistoryQuery.isError) {
    return <Text>Error!</Text>;
  }

  if (runHistoryQuery.isPending) {
    return <Text>Loading...</Text>;
  }

  const history =
    runHistoryQuery?.data?.filter(
      (run) => run.request_file_path === requestFilePath
    ) ?? [];

  if (history.length === 0) {
    return <Alert>No runs in history yet.</Alert>;
  }

  const requestRun =
    runId === null ? null : (history.find((x) => x.uuid === runId) ?? null);

  return (
    <Stack>
      <RequestRunSelect
        value={runId}
        onChange={setRunId}
        requestRunHistory={history}
      />

      <Anchor
        component={Link}
        to="/history"
        size="sm"
        search={{
          // @ts-ignore
          requestFilePath,
        }}
      >
        See more runs...
      </Anchor>

      {requestRun && (
        <Card>
          <RequestRunHistoryItem requestRun={requestRun} />
        </Card>
      )}
    </Stack>
  );
};
