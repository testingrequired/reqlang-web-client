import { createFileRoute } from "@tanstack/react-router";
import {
  ActionIcon,
  Alert,
  ButtonGroup,
  Card,
  Code,
  CopyButton,
  Loader,
  Stack,
  Tabs,
  Text,
  Tooltip,
} from "@mantine/core";
import { useEffect } from "react";
import { ParseResult } from "reqlang-types";
import { RunRequestForm } from "@/components/RunRequestForm";
import { FilesSelect } from "@/components/FileSelect";
import { IconCopy, IconCopyCheckFilled } from "@tabler/icons-react";
import { RequestRunHistory } from "@/components/RequestRunHistory";
import { useSelectedRequestFileStore } from "@/stores/selectedRequestFile";
import { useGetFileQuery, useGetFilesQuery } from "@/queries/files";
import { useParsedRequestFileMutation } from "@/queries/parse";

export const Route = createFileRoute("/")({
  component: RouteComponent,
});

function RouteComponent() {
  const query = useParsedRequestFileMutation();
  const filesQuery = useGetFilesQuery();
  const selectedRequestFileStore = useSelectedRequestFileStore();
  const fileQuery = useGetFileQuery(selectedRequestFileStore.value);

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
          <FilesSelect
            onChange={selectedRequestFileStore.set}
            value={selectedRequestFileStore.value}
          />

          <Alert
            color="red"
            title={`Error loading '${selectedRequestFileStore.value}'`}
          >
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
    return <Loader />;
  }

  const data: ParseResult = query.data!;

  const refreshFileText = () => {
    fileQuery.refetch();
  };

  return (
    <Stack>
      <FilesSelect
        onChange={selectedRequestFileStore.set}
        value={selectedRequestFileStore.value}
      />

      {typeof data !== "undefined" && (
        <>
          <Tabs defaultValue="run">
            <Tabs.List>
              <Tabs.Tab value="run">Run</Tabs.Tab>
              <Tabs.Tab value="history">History</Tabs.Tab>
              <Tabs.Tab value="file">File</Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="run" p="md">
              <RunRequestForm
                result={data}
                requestFilePath={selectedRequestFileStore.value ?? ""}
                requestFileText={fileQuery.data!}
                refreshFile={refreshFileText}
              />
            </Tabs.Panel>

            <Tabs.Panel value="history" p="md">
              <RequestRunHistory
                result={data}
                requestFilePath={selectedRequestFileStore.value}
              />
            </Tabs.Panel>

            <Tabs.Panel value="file" p="md">
              <Card>
                <Code block>{fileQuery.data}</Code>
                <ButtonGroup>
                  <CopyButton value={fileQuery.data ?? ""}>
                    {({ copied, copy }) => (
                      <Tooltip label="Copy">
                        <ActionIcon
                          onClick={copy}
                          color="dark"
                          aria-label="Copy"
                        >
                          {copied ? (
                            <IconCopyCheckFilled stroke={1} />
                          ) : (
                            <IconCopy stroke={1} />
                          )}
                        </ActionIcon>
                      </Tooltip>
                    )}
                  </CopyButton>
                </ButtonGroup>
              </Card>
            </Tabs.Panel>
          </Tabs>
        </>
      )}
    </Stack>
  );
}
