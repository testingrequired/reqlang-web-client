import { Card, Stack, Text } from "@mantine/core";
import { useState } from "react";
import { RequestRunHistoryItem } from "./RequestRunHistoryItem";
import { RequestRunSelect } from "./RequestRunSelect";
import { useGetRunHistoryForRequestQuery } from "@/queries/history";

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

  const requestRun =
    runId === null ? null : (history.find((x) => x.uuid === runId) ?? null);

  return (
    <Stack gap="xl">
      <RequestRunSelect
        value={runId}
        onChange={setRunId}
        requestRunHistory={history}
      />

      {requestRun && (
        <Card>
          <RequestRunHistoryItem requestRun={requestRun} />
        </Card>
      )}
    </Stack>
  );
};
