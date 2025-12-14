import { Code, Stack, Table, Text, Title } from "@mantine/core";
import { ParseResult, RequestParamsFromClient } from "reqlang-types";
import { RequestRun } from "server-types";

type Props = {
  requestRun: RequestRun;
  params: RequestParamsFromClient;
  result: ParseResult;
  clientContextReferences: string[];
};

export const RequestRunHistoryItem = ({
  requestRun,
  params,
  result,
  clientContextReferences,
}: Props) => {
  return (
    <Stack gap="xs">
      <Title order={3} mb={0}>
        Response
      </Title>

      <Code block mt={0}>
        {requestRun.response}
      </Code>

      {params?.env && (
        <>
          <Title order={3}>Environment</Title>

          <Text>{params.env}</Text>
        </>
      )}

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
                  <Table.Td>{params?.vars[key]}</Table.Td>
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
                  <Table.Td>{params?.prompts[prompt]}</Table.Td>
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
                  <Table.Td>{params?.secrets[secret]}</Table.Td>
                </Table.Tr>
              );
            })}
          </Table.Tbody>
        </Table>
      ) : null}

      {clientContextReferences.length > 0 ? (
        <Table>
          <Table.Thead>
            <Table.Tr>
              <Table.Th w="15rem">Client Context</Table.Th>
              <Table.Th>Value</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {clientContextReferences.map((key, i) => {
              return (
                <Table.Tr key={i}>
                  <Table.Td>{key}</Table.Td>
                  <Table.Td>{params?.provider_values[key!]}</Table.Td>
                </Table.Tr>
              );
            })}
          </Table.Tbody>
        </Table>
      ) : null}
    </Stack>
  );
};
