import { createFileRoute } from "@tanstack/react-router";
import Uploader from "@/components/Uploader";
import {
  Alert,
  ButtonGroup,
  Code,
  Group,
  Stack,
  Tabs,
  Text,
} from "@mantine/core";
import { CloseRequestFileButton } from "@/components/CloseRequestFileButton";
import { useFileStore } from "@/stores/loadedRequestFile";
import { useParsedRequestFileQuery } from "@/queries/parseReqlang";
import { useEffect } from "react";
import { ParseResult } from "reqlang-types";
import { RequestDetails } from "@/components/RequestDetails";
import { RunRequestForm } from "@/components/RunRequestForm";

export const Route = createFileRoute("/")({
  component: RouteComponent,
});

function RouteComponent() {
  const fileStore = useFileStore();

  const query = useParsedRequestFileQuery();

  useEffect(() => {
    if (typeof fileStore.file === "undefined" || fileStore.file === null) {
      return;
    }

    query.mutate(fileStore.file?.text!);
  }, [fileStore.file?.text!]);

  if (!query.isIdle) {
    if (query.isError) {
      return (
        <Stack>
          <Uploader onUpload={fileStore.setFile} />

          <Alert
            color="red"
            title={`Error loading '${fileStore.file?.fileName}'`}
          >
            <Text size="sm">{query.error.message}</Text>

            <Code block>{fileStore.file?.text}</Code>

            <Text size="sm">Errors</Text>

            {query.error.cause! && (
              <Code block>{JSON.stringify(query.error.cause, null, 2)}</Code>
            )}
          </Alert>
        </Stack>
      );
    }
  }

  if (query.isPending) {
    return <p>Loading...</p>;
  }

  const data: ParseResult = query.data!;

  if (fileStore.file === null) {
    return <Uploader onUpload={fileStore.setFile} />;
  }

  return (
    <Stack>
      <Uploader onUpload={fileStore.setFile} />

      {fileStore.file && (
        <Group align="top" mt="xl">
          <Text m={0}>{fileStore.file.fileName}</Text>
          <ButtonGroup>
            <CloseRequestFileButton onClick={fileStore.unsetFile} />
          </ButtonGroup>
        </Group>
      )}

      {typeof data !== "undefined" && (
        <>
          <Tabs defaultValue="run">
            <Tabs.List>
              <Tabs.Tab value="run">Run</Tabs.Tab>
              <Tabs.Tab value="details">Details</Tabs.Tab>
              <Tabs.Tab value="raw">Raw</Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="run" p="md">
              <RunRequestForm result={data} />
            </Tabs.Panel>

            <Tabs.Panel value="details" p="md">
              <RequestDetails result={data} />
            </Tabs.Panel>

            <Tabs.Panel value="raw" p="md">
              <Code block>{fileStore.file?.text}</Code>
            </Tabs.Panel>
          </Tabs>
        </>
      )}
    </Stack>
  );
}
