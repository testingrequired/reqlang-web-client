import { createFileRoute } from "@tanstack/react-router";
import { Alert, Code, Stack, Tabs, Text } from "@mantine/core";
import {
  useGetFileQuery,
  useGetFilesQuery,
  useParsedRequestFileQuery,
} from "@/queries/parseReqlang";
import { useEffect, useState } from "react";
import { ParseResult } from "reqlang-types";
import { RequestDetails } from "@/components/RequestDetails";
import { RunRequestForm } from "@/components/RunRequestForm";
import { FilesSelect } from "@/components/FileSelect";

export const Route = createFileRoute("/")({
  component: RouteComponent,
});

function RouteComponent() {
  const query = useParsedRequestFileQuery();
  const filesQuery = useGetFilesQuery();
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const fileQuery = useGetFileQuery(selectedFile);

  useEffect(() => {
    if (!fileQuery.data) {
      return;
    }

    query.mutate(fileQuery.data);
  }, [fileQuery.data]);

  if (!query.isIdle) {
    if (query.isError) {
      return (
        <Stack>
          <FilesSelect onChange={setSelectedFile} value={selectedFile} />

          <Alert color="red" title={`Error loading '${selectedFile}'`}>
            <Text size="sm">{query.error.message}</Text>

            <Code block>{fileQuery.data}</Code>

            <Text size="sm">Errors</Text>

            {query.error.cause! && (
              <Code block>{JSON.stringify(query.error.cause, null, 2)}</Code>
            )}
          </Alert>
        </Stack>
      );
    }
  }

  if (query.isPending || filesQuery.isPending || fileQuery.isLoading) {
    return <p>Loading...</p>;
  }

  const data: ParseResult = query.data!;

  const refreshFileText = () => {
    fileQuery.refetch();
  };

  return (
    <Stack>
      <FilesSelect onChange={setSelectedFile} value={selectedFile} />

      {typeof data !== "undefined" && (
        <>
          <Tabs defaultValue="run">
            <Tabs.List>
              <Tabs.Tab value="run">Run</Tabs.Tab>
              <Tabs.Tab value="details">Details</Tabs.Tab>
              <Tabs.Tab value="raw">Raw</Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="run" p="md">
              <RunRequestForm
                result={data}
                requestFileText={fileQuery.data!}
                refreshFile={refreshFileText}
              />
            </Tabs.Panel>

            <Tabs.Panel value="details" p="md">
              <RequestDetails result={data} />
            </Tabs.Panel>

            <Tabs.Panel value="raw" p="md">
              <Code block>{fileQuery.data}</Code>
            </Tabs.Panel>
          </Tabs>
        </>
      )}
    </Stack>
  );
}
