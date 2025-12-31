import { RequestRunHistoryItemCollapsable } from "@/components/RequestRunHistoryItemCollapsable";
import { useGetDebugInfoQuery } from "@/queries/debug";
import { useGetRunHistoryQuery } from "@/queries/history";
import {
  Alert,
  Anchor,
  Card,
  Group,
  List,
  Loader,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import {
  IconBrandGithubFilled,
  IconFolderRoot,
  IconWorldWww,
} from "@tabler/icons-react";
import { createFileRoute, Link } from "@tanstack/react-router";

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
          <Text m={0} data-testid="project-cwd">
            {debugInfoQuery.data.cwd}
          </Text>
        </Group>
      </Card>

      <Title order={2}>Latest Runs</Title>

      {lastRuns.length > 0 ? (
        <Stack>
          {lastRuns.map((lastRun) => (
            <RequestRunHistoryItemCollapsable requestRun={lastRun} />
          ))}

          <Anchor component={Link} to="/history" size="sm">
            See more...
          </Anchor>
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
              <IconWorldWww stroke={1.0} />

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
