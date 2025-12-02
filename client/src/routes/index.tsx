import { createFileRoute } from "@tanstack/react-router";
import Uploader from "@/components/Uploader";
import {
  ButtonGroup,
  Card,
  Code,
  Collapse,
  Group,
  Stack,
  Table,
  Tabs,
  Text,
  Title,
} from "@mantine/core";
import { CloseRequestFileButton } from "@/components/CloseRequestFileButton";
import { useFileStore } from "@/stores/loadedRequestFile";
import { useParsedRequestFileQuery } from "@/queries/parseReqlang";
import { useEffect } from "react";
import { ParseResult } from "reqlang-types";
import { useDisclosure } from "@mantine/hooks";

export const Route = createFileRoute("/")({
  component: RouteComponent,
});

function RouteComponent() {
  const [
    expectedResponseOpened,
    { toggle: toggleExpectedResponse, close: closeExpectedResponse },
  ] = useDisclosure(false);

  const [
    configurationOpened,
    { toggle: toggleConfiguration, close: closeConfiguration },
  ] = useDisclosure(false);

  const fileStore = useFileStore();

  const query = useParsedRequestFileQuery();

  useEffect(() => {
    if (typeof fileStore.file === "undefined" || fileStore.file === null) {
      return;
    }

    query.mutate(fileStore.file?.text!);
  }, [fileStore.file?.text!]);

  const handleDropDrop = (file: Parameters<typeof fileStore.setFile>[0]) => {
    fileStore.setFile(file);
    closeExpectedResponse();
    closeConfiguration();
  };

  if (!query.isIdle) {
    if (query.isError) {
      return <p>Error: {query.error.message}</p>;
    }
  }

  if (query.isPending) {
    return <p>Loading...</p>;
  }

  const data: ParseResult = query.data!;

  return fileStore.file === null ? (
    <Stack>
      <Uploader onUpload={handleDropDrop} />
    </Stack>
  ) : typeof data !== "undefined" ? (
    <Stack>
      <Uploader onUpload={handleDropDrop} />

      <Tabs defaultValue="details">
        <Tabs.List>
          <Tabs.Tab value="details">Details</Tabs.Tab>
          <Tabs.Tab value="raw">Raw</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="details" p="md">
          <Stack>
            <Group align="top">
              <Text>{fileStore.file.fileName}</Text>
              <ButtonGroup>
                <CloseRequestFileButton onClick={fileStore.unsetFile} />
              </ButtonGroup>
            </Group>

            <Card>
              <Title order={3}>Request</Title>

              <Table>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Verb</Table.Th>
                    <Table.Th>Target</Table.Th>
                    <Table.Th>Version</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  <Table.Tr>
                    <Table.Td>{data.request.verb}</Table.Td>
                    <Table.Td>{data.request.target}</Table.Td>
                    <Table.Td>{data.request.http_version}</Table.Td>
                  </Table.Tr>
                </Table.Tbody>
              </Table>

              {data.request.headers.length > 0 && (
                <>
                  <Title order={4}>Headers</Title>
                  <Table>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>Header</Table.Th>
                        <Table.Th>Value</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {data.request.headers.map((header, i) => {
                        return (
                          <Table.Tr key={i}>
                            <Table.Td>{header[0]}</Table.Td>
                            <Table.Td>{header[1]}</Table.Td>
                          </Table.Tr>
                        );
                      })}
                    </Table.Tbody>
                  </Table>
                </>
              )}

              {(data.request.body?.length ?? 0) > 0 && (
                <>
                  <Title order={4}>Body</Title>
                  <Code block>{data.request.body}</Code>
                </>
              )}

              {data.full.response && (
                <>
                  <Title order={4} onClick={toggleExpectedResponse}>
                    Expected Response
                  </Title>

                  <Collapse in={expectedResponseOpened}>
                    <Card>
                      <Table>
                        <Table.Thead>
                          <Table.Tr>
                            <Table.Th>Version</Table.Th>
                            <Table.Th>Status Code</Table.Th>
                            <Table.Th>Status Text</Table.Th>
                          </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                          <Table.Tr>
                            <Table.Td>
                              {data.full.response[0].http_version}
                            </Table.Td>
                            <Table.Td>
                              {data.full.response[0].status_code}
                            </Table.Td>
                            <Table.Td>
                              {data.full.response[0].status_text}
                            </Table.Td>
                          </Table.Tr>
                        </Table.Tbody>
                      </Table>

                      {data.full.response[0].headers.length > 0 && (
                        <>
                          <Title order={5}>Headers</Title>
                          <Table>
                            <Table.Thead>
                              <Table.Tr>
                                <Table.Th>Header</Table.Th>
                                <Table.Th>Value</Table.Th>
                              </Table.Tr>
                            </Table.Thead>
                            <Table.Tbody>
                              {data.full.response[0].headers.map(
                                (header, i) => {
                                  return (
                                    <Table.Tr key={i}>
                                      <Table.Td>{header[0]}</Table.Td>
                                      <Table.Td>{header[1]}</Table.Td>
                                    </Table.Tr>
                                  );
                                }
                              )}
                            </Table.Tbody>
                          </Table>
                        </>
                      )}

                      {(data.full.response[0].body?.length ?? 0) > 0 && (
                        <>
                          <Title order={5}>Body</Title>
                          <Code block>{data.full.response[0].body}</Code>
                        </>
                      )}
                    </Card>
                  </Collapse>
                </>
              )}
            </Card>

            <Title order={3} onClick={toggleConfiguration}>
              Configuration
            </Title>

            <Collapse in={configurationOpened}>
              <Title order={4}>Environments</Title>

              {data.envs.length > 0 ? (
                <Table>
                  <Table.Tbody>
                    {data.envs.map((env, i) => {
                      return (
                        <Table.Tr key={i}>
                          <Table.Td>{env}</Table.Td>
                        </Table.Tr>
                      );
                    })}
                  </Table.Tbody>
                </Table>
              ) : (
                <Text>No environments defined</Text>
              )}

              <Title order={4}>Parameters</Title>

              <Title order={5}>Variables</Title>

              {data.vars.length > 0 ? (
                <Table>
                  <Table.Tbody>
                    {data.vars.map((v, i) => {
                      return (
                        <Table.Tr key={i}>
                          <Table.Td>{v}</Table.Td>
                        </Table.Tr>
                      );
                    })}
                  </Table.Tbody>
                </Table>
              ) : (
                <Text>No variables defined</Text>
              )}

              <Title order={5}>Prompts</Title>

              {data.prompts.length > 0 ? (
                <Table>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Prompt</Table.Th>
                      <Table.Th>Default Value</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {data.prompts.map((prompt, i) => {
                      return (
                        <Table.Tr key={i}>
                          <Table.Td>{prompt}</Table.Td>
                          <Table.Td>
                            {data.default_prompt_values[prompt] ?? "No default"}
                          </Table.Td>
                        </Table.Tr>
                      );
                    })}
                  </Table.Tbody>
                </Table>
              ) : (
                <Text>No prompts defined</Text>
              )}

              <Title order={5}>Secrets</Title>

              {data.secrets.length > 0 ? (
                <Table>
                  <Table.Tbody>
                    {data.secrets.map((secret, i) => {
                      return (
                        <Table.Tr key={i}>
                          <Table.Td>{secret}</Table.Td>
                        </Table.Tr>
                      );
                    })}
                  </Table.Tbody>
                </Table>
              ) : (
                <Text>No secrets defined</Text>
              )}
            </Collapse>
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="raw" p="md">
          <Code block>{fileStore.file.text}</Code>
        </Tabs.Panel>
      </Tabs>
    </Stack>
  ) : null;
}
