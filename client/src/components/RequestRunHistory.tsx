import { Card, Stack, Text, Title } from "@mantine/core";
import { useState } from "react";
import { RequestRunHistoryItem } from "./RequestRunHistoryItem";
import { RequestRunSelect } from "./RequestRunSelect";
import { useGetRunHistoryForRequestQuery } from "@/queries/history";

type Props = {
  requestFilePath: string | null;
};

export const RequestRunHistory: React.FC<Props> = ({ requestFilePath }) => {
  const [runIndex, setRunIndex] = useState<number | null>(null);
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

  const requestRun = runIndex === null ? null : history[runIndex];

  return (
    <Stack>
      <Title order={2}>Run History</Title>

      <RequestRunSelect
        value={runIndex}
        onChange={setRunIndex}
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
