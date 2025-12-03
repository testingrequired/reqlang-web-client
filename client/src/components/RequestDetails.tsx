import { Card, Code, Collapse, Stack, Table, Text, Title } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { ParseResult } from "reqlang-types";

type Props = {
  result: ParseResult;
};

export const RequestDetails: React.FC<Props> = ({ result }) => {
  const [expectedResponseOpened, { toggle: toggleExpectedResponse }] =
    useDisclosure(false);

  const [configurationOpened, { toggle: toggleConfiguration }] =
    useDisclosure(false);

  return (
    <Stack>
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
              <Table.Td>{result.request.verb}</Table.Td>
              <Table.Td>{result.request.target}</Table.Td>
              <Table.Td>{result.request.http_version}</Table.Td>
            </Table.Tr>
          </Table.Tbody>
        </Table>

        {result.request.headers.length > 0 && (
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
                {result.request.headers.map((header, i) => {
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

        {(result.request.body?.length ?? 0) > 0 && (
          <>
            <Title order={4}>Body</Title>
            <Code block>{result.request.body}</Code>
          </>
        )}

        {result.full.response && (
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
                        {result.full.response[0].http_version}
                      </Table.Td>
                      <Table.Td>{result.full.response[0].status_code}</Table.Td>
                      <Table.Td>{result.full.response[0].status_text}</Table.Td>
                    </Table.Tr>
                  </Table.Tbody>
                </Table>

                {result.full.response[0].headers.length > 0 && (
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
                        {result.full.response[0].headers.map((header, i) => {
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

                {(result.full.response[0].body?.length ?? 0) > 0 && (
                  <>
                    <Title order={5}>Body</Title>
                    <Code block>{result.full.response[0].body}</Code>
                  </>
                )}
              </Card>
            </Collapse>
          </>
        )}
      </Card>

      {result.full.comments.length > 0 && (
        <Card p="xs">
          <Title order={4} mb={0}>
            Comments
          </Title>

          <Code
            block
            style={{
              textWrap: "wrap",
            }}
          >
            {result.full.comments.map(([comment]) => comment).join("")}
          </Code>
        </Card>
      )}

      <Title order={3} onClick={toggleConfiguration}>
        Configuration
      </Title>

      <Collapse in={configurationOpened}>
        <Title order={4}>Environments</Title>

        {result.envs.length > 0 ? (
          <Table>
            <Table.Tbody>
              {result.envs.map((env, i) => {
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

        {result.vars.length > 0 ? (
          <Table>
            <Table.Tbody>
              {result.vars.map((v, i) => {
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

        {result.prompts.length > 0 ? (
          <Table>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Prompt</Table.Th>
                <Table.Th>Default Value</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {result.prompts.map((prompt, i) => {
                return (
                  <Table.Tr key={i}>
                    <Table.Td>{prompt}</Table.Td>
                    <Table.Td>
                      {result.default_prompt_values[prompt] ?? "No default"}
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

        {result.secrets.length > 0 ? (
          <Table>
            <Table.Tbody>
              {result.secrets.map((secret, i) => {
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
  );
};
