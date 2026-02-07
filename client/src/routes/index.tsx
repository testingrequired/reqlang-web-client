import { RequestRunHistoryItemCollapsable } from "@/components/common/RequestRunHistoryItemCollapsable";
import { useGetDebugInfoQuery } from "@/queries/debug";
import { useGetRunHistoryQuery } from "@/queries/history";
import {
  Alert,
  Anchor,
  Card,
  Code,
  Group,
  List,
  Loader,
  Stack,
  Title,
} from "@mantine/core";
import {
  IconBrandGithubFilled,
  IconDatabaseExclamation,
  IconFolder,
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

  const isNotDbEncrypted = !debugInfoQuery.data.db_is_encrypted;

  return (
    <Stack gap="xs" data-testid="home-view">
      {isNotDbEncrypted && (
        <Alert
          color="orange"
          title="Database Is Not Encrypted"
          icon={<IconDatabaseExclamation />}
          mb="lg"
        >
          Secrets will be stored in plain text!
        </Alert>
      )}

      <Card>
        <Group>
          <IconFolder />
          <Code
            m={0}
            data-testid="project-cwd"
            style={{
              cursor: "default",
            }}
          >
            {debugInfoQuery.data.cwd}
          </Code>
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
        <Alert data-testid="latest-runs-alert">
          No requests have been ran yet.
        </Alert>
      )}

      <Title order={2}>Documentation</Title>
      <Card data-testid="doclinks">
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
              <IconBrandGithubFilled />
              <Anchor
                href="https://github.com/testingrequired/reqlang-web-client"
                target="_blank"
              >
                testingrequired/reqlang-web-client
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
    </Stack>
  );
}
