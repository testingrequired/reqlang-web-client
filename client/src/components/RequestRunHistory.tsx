import { useGetRunHistoryQuery } from "@/queries/parseReqlang";
import { Code, Select, Stack, Table, Text, Title } from "@mantine/core";
import moment from "moment";
import { useState } from "react";
import { ParseResult } from "reqlang-types";
import { RequestParamsFromClient, RequestRun } from "server-types";

type Props = {
  requestFilePath: string | null;
  result: ParseResult;
};

export const RequestRunHistory: React.FC<Props> = ({
  requestFilePath,
  result,
}) => {
  const query = useGetRunHistoryQuery();
  const [runIndex, setRunIndex] = useState<string | null>(null);

  const providerReferences = result.full.refs
    .filter((ref) => Object.keys(ref[0]).at(0) === "Provider")
    .map((e) => Object.values(e[0]).at(0));

  if (query.isError) {
    return <p>Error</p>;
  }

  if (query.isPending) {
    return <p>Loading...</p>;
  }

  const history = query.data.filter(
    (run) => run.request_file_path === requestFilePath
  );

  if (history.length === 0) {
    debugger;
    return <Text>No runs in request's history</Text>;
  }

  history.sort(
    (a, b) =>
      (b.request_at as unknown as number) - (a.request_at as unknown as number)
  );

  const selectedRun: RequestRun | null =
    runIndex === null ? null : history[parseInt(runIndex, 10)];

  const selectedRunParams: RequestParamsFromClient | null =
    selectedRun === null
      ? null
      : (JSON.parse(
          selectedRun.params_from_client_json
        ) as unknown as RequestParamsFromClient);

  return (
    <Stack>
      <Title order={2}>Run History</Title>

      <Select
        placeholder="Select a request run in history"
        data={history.map((run, i) => {
          return {
            value: `${i}`,
            label: moment(run.request_at as unknown as number).fromNow(),
          };
        })}
        value={runIndex}
        onChange={(value) => {
          setRunIndex(value);
        }}
        clearable
        mb="xl"
      />

      {selectedRun && (
        <Stack gap="xs">
          <Title order={3} mb={0}>
            Response
          </Title>

          <Code block mt={0}>
            {selectedRun.response}
          </Code>

          <Title order={3}>Environment</Title>

          <Text>{selectedRunParams?.env ?? "null"}</Text>

          <Title order={3}>Parameters</Title>

          {result.vars.length > 0 ? (
            <Table>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th w="15rem">Variable</Table.Th>
                  <Table.Th>Value</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {result.vars.map((key, i) => {
                  return (
                    <Table.Tr key={i}>
                      <Table.Td>{key}</Table.Td>
                      <Table.Td>{selectedRunParams?.vars[key]}</Table.Td>
                    </Table.Tr>
                  );
                })}
              </Table.Tbody>
            </Table>
          ) : null}

          {result.prompts.length > 0 ? (
            <Table>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th w="15rem">Prompt</Table.Th>
                  <Table.Th>Value</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {result.prompts.map((prompt, i) => {
                  return (
                    <Table.Tr key={i}>
                      <Table.Td>{prompt}</Table.Td>
                      <Table.Td>{selectedRunParams?.prompts[prompt]}</Table.Td>
                    </Table.Tr>
                  );
                })}
              </Table.Tbody>
            </Table>
          ) : null}

          {result.secrets.length > 0 ? (
            <Table>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th w="15rem">Secret</Table.Th>
                  <Table.Th>Value</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {result.secrets.map((secret, i) => {
                  return (
                    <Table.Tr key={i}>
                      <Table.Td>{secret}</Table.Td>
                      <Table.Td>{selectedRunParams?.secrets[secret]}</Table.Td>
                    </Table.Tr>
                  );
                })}
              </Table.Tbody>
            </Table>
          ) : null}

          {providerReferences.length > 0 ? (
            <Table>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th w="15rem">Client Context</Table.Th>
                  <Table.Th>Value</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {providerReferences.map((key, i) => {
                  return (
                    <Table.Tr key={i}>
                      <Table.Td>{key}</Table.Td>
                      <Table.Td>
                        {selectedRunParams?.provider_values[key!]}
                      </Table.Td>
                    </Table.Tr>
                  );
                })}
              </Table.Tbody>
            </Table>
          ) : null}
        </Stack>
      )}
    </Stack>
  );
};
