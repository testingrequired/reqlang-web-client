import { FilesSelect } from "@/components/FileSelect";
import { useGetRunHistoryQuery } from "@/queries/parseReqlang";
import {
  ActionIcon,
  Card,
  Code,
  Group,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { IconX } from "@tabler/icons-react";
import { createFileRoute } from "@tanstack/react-router";
import moment from "moment";
import { useState } from "react";

export const Route = createFileRoute("/history")({
  component: RouteComponent,
});

function RouteComponent() {
  const query = useGetRunHistoryQuery();
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  if (query.isError) {
    return <p>Error</p>;
  }

  if (query.isPending) {
    return <p>Loading...</p>;
  }

  const history =
    selectedFile === null
      ? query.data
      : query.data.filter((run) => run.request_file_path === selectedFile);

  history.sort(
    (a, b) =>
      (b.request_at as unknown as number) - (a.request_at as unknown as number)
  );

  return (
    <Stack gap="xl">
      <Title order={2}>History</Title>

      <Group>
        <ActionIcon
          disabled={selectedFile === null}
          onClick={(e) => {
            e.preventDefault();

            setSelectedFile(null);
          }}
        >
          <IconX />
        </ActionIcon>
        <FilesSelect onChange={setSelectedFile} value={selectedFile} />
      </Group>

      {history.map((run) => (
        <Stack gap="xs">
          <Text size="md" m={0}>
            {run.request_file_path} (
            {moment(run.request_at as unknown as number).fromNow()})
          </Text>

          <Card>
            <Text size="md" m={0}>
              Params
            </Text>
            <Code block style={{ maxWidth: "100%" }}>
              {run.params_from_client_json}
            </Code>
          </Card>

          <Card>
            <Text size="md" m={0}>
              Response
            </Text>
            <Code block style={{ maxWidth: "100%" }}>
              {run.response}
            </Code>
          </Card>
        </Stack>
      ))}
    </Stack>
  );
}
