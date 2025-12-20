import { useGetDebugInfoQuery } from "@/queries/debug";
import { Anchor, Card, Group, List, Loader, Text, Title } from "@mantine/core";
import {
  IconBrandGithubFilled,
  IconFile,
  IconFolderRoot,
} from "@tabler/icons-react";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: RouteComponent,
});

function RouteComponent() {
  const debugInfoQuery = useGetDebugInfoQuery();

  if (debugInfoQuery.isPending) {
    return <Loader />;
  }

  if (debugInfoQuery.isError) {
    return <p>Error: {debugInfoQuery.error.message}</p>;
  }

  return (
    <>
      <Title order={2}>Project</Title>
      <Card>
        <Group>
          <IconFolderRoot />
          <Text m={0}>{debugInfoQuery.data.cwd} </Text>
        </Group>
      </Card>

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
