import { RequestRunHistoryItem } from "@/components/RequestRunHistoryItem";
import { useGetDebugInfoQuery } from "@/queries/debug";
import { useGetRunHistoryQuery } from "@/queries/history";
import {
  ActionIcon,
  Alert,
  Anchor,
  Badge,
  Card,
  Group,
  List,
  Loader,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
  IconBrandGithubFilled,
  IconCaretDownFilled,
  IconCaretUpFilled,
  IconFile,
  IconFolderRoot,
} from "@tabler/icons-react";
import { createFileRoute, Link } from "@tanstack/react-router";
import moment from "moment";
import { RequestRun } from "server-types";

export const Route = createFileRoute("/")({
  component: RouteComponent,
});

function RouteComponent() {
  const debugInfoQuery = useGetDebugInfoQuery();
  const runHistory = useGetRunHistoryQuery();

  if (debugInfoQuery.isPending || runHistory.isPending) {
    return <Loader />;
  }

  if (debugInfoQuery.isError) {
    return <Alert color="red">Error: {debugInfoQuery.error.message}</Alert>;
  }

  if (runHistory.isError) {
    return <Alert color="red">Error: {runHistory.error.message}</Alert>;
  }

  const lastRuns = runHistory.data.slice(0, 5);

  return (
    <>
      <Title order={2}>Project</Title>
      <Card>
        <Group>
          <IconFolderRoot />
          <Text m={0}>{debugInfoQuery.data.cwd} </Text>
        </Group>
      </Card>

      <Title order={2}>Latest Runs</Title>

      {lastRuns.length > 0 ? (
        <Stack>
          {lastRuns.map((lastRun) => (
            <LatestRunsRun requestRun={lastRun} />
          ))}
        </Stack>
      ) : (
        <Alert>No requests have been ran yet.</Alert>
      )}

      <Title order={2}>Documentation</Title>
      <Card>
        <List m={0} listStyleType="none" p={0}>
          <List.Item>
            <Group>
              <IconBrandGithubFilled />
              <Anchor
                href="https://github.com/testingrequired/reqlang"
                target="_blank"
              >
                testingrequired/reqlang
              </Anchor>
            </Group>
          </List.Item>
          <List.Item>
            <Group>
              <IconBrandGithubFilled />
              <Anchor
                href="https://github.com/testingrequired/reqlang-expr"
                target="_blank"
              >
                testingrequired/reqlang-expr
              </Anchor>
            </Group>
          </List.Item>
          <List.Item>
            <Group>
              <IconFile />

              <Anchor
                href="https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Messages"
                target="_blank"
              >
                HTTP messages - MDN
              </Anchor>
            </Group>
          </List.Item>
        </List>
      </Card>
    </>
  );
}

type LatestRunsRunProps = {
  requestRun: RequestRun;
};

const LatestRunsRun = ({ requestRun }: LatestRunsRunProps) => {
  const [isFullView, fullViewHandlers] = useDisclosure(false);
  return (
    <Card>
      <Group mb={isFullView ? "md" : "0"}>
        <ActionIcon onClick={fullViewHandlers.toggle}>
          {isFullView ? <IconCaretDownFilled /> : <IconCaretUpFilled />}
        </ActionIcon>

        <Badge variant="transparent" color="white">
          {moment(requestRun.request_at as unknown as number).fromNow()}
        </Badge>

        <Link
          to="/history"
          search={{
            requestFilePath: requestRun.request_file_path,
          }}
        >
          <Badge
            variant="transparent"
            color="white"
            style={{
              cursor: "pointer",
            }}
          >
            {requestRun.request_file_path}
          </Badge>
        </Link>

        <Link
          to="/history"
          search={{
            runId: requestRun.uuid,
          }}
        >
          <Badge
            radius="lg"
            variant="transparent"
            color="dark"
            style={{
              cursor: "pointer",
            }}
          >
            {requestRun.uuid.slice(0, 8)}
          </Badge>
        </Link>

        <Text size="md" m={0}></Text>
      </Group>

      {isFullView && (
        <Card>
          <RequestRunHistoryItem requestRun={requestRun} />
        </Card>
      )}
    </Card>
  );
};
