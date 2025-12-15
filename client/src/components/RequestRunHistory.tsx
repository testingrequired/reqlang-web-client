import { Stack, Text, Title } from "@mantine/core";
import { useState } from "react";
import { ParseResult } from "reqlang-types";
import { RequestParamsFromClient } from "server-types";
import { RequestRunHistoryItem } from "./RequestRunHistoryItem";
import { RequestRunSelect } from "./RequestRunSelect";
import { useGetRunHistoryForRequestQuery } from "@/queries/history";

type Props = {
  requestFilePath: string | null;
  result: ParseResult;
};

export const RequestRunHistory: React.FC<Props> = ({
  requestFilePath,
  result,
}) => {
  const [runIndex, setRunIndex] = useState<number | null>(null);
  const runHistoryQuery = useGetRunHistoryForRequestQuery(requestFilePath);

  const providerReferences = result.full.refs
    .filter((ref) => Object.keys(ref[0]).at(0) === "Provider")
    .map(([ref]) => Object.values(ref).at(0));

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

  const selectedRunParams: RequestParamsFromClient | null =
    requestRun === null
      ? null
      : (JSON.parse(
          requestRun.params_from_client_json
        ) as unknown as RequestParamsFromClient);

  return (
    <Stack>
      <Title order={2}>Run History</Title>

      <RequestRunSelect
        value={runIndex}
        onChange={setRunIndex}
        requestRunHistory={history}
      />

      {requestRun && selectedRunParams && (
        <RequestRunHistoryItem
          requestRun={requestRun}
          result={result}
          clientContextReferences={providerReferences as any}
          params={selectedRunParams}
        />
      )}
    </Stack>
  );
};
