import { useGetFileQuery } from "@/queries/files";
import { useParsedRequestFileMutation } from "@/queries/parse";
import { Code, Loader, Stack, Table, Text } from "@mantine/core";
import { useEffect } from "react";
import { RequestParamsFromClient } from "reqlang-types";
import { RequestRun } from "server-types";

type Props = {
  requestRun: RequestRun;
};

export const RequestRunHistoryItem = ({ requestRun }: Props) => {
  const parseRequestFileMutation = useParsedRequestFileMutation();
  const fileQuery = useGetFileQuery(requestRun.request_file_path);
  const params: RequestParamsFromClient = JSON.parse(
    requestRun.params_from_client_json
  );

  useEffect(() => {
    if (!fileQuery.data) {
      return;
    }

    parseRequestFileMutation.mutate(fileQuery.data);
  }, [fileQuery.data]);

  if (
    parseRequestFileMutation.isPending ||
    fileQuery.isLoading ||
    typeof parseRequestFileMutation.data === "undefined"
  ) {
    return <Loader />;
  }

  if (parseRequestFileMutation.error) {
    return <p>ERRROR!</p>;
  }

  const result = parseRequestFileMutation.data!;

  const clientContextReferences = result.full.refs
    .filter((ref) => Object.keys(ref[0]).at(0) === "Provider")
    .map(([ref]) => Object.values(ref).at(0));

  return (
    <Stack gap="xl">
      <Stack>
        <Text mb={0} fw="bold">
          Request
        </Text>

        <Code block m={0}>
          {params.reqfile.slice(
            result.full.request[1].start,
            result.full.request[1].end
          )}
        </Code>
      </Stack>

      <Stack>
        <Text mb={0} fw="bold">
          Response
        </Text>

        <Code block mt={0}>
          {requestRun.response}
        </Code>
      </Stack>

      {params?.env && (
        <Stack>
          <Text mb={0} fw="bold">
            Environment
          </Text>

          <Code p="md">{params.env}</Code>
        </Stack>
      )}

      <Stack>
        <Text mb={0} fw="bold">
          Parameters
        </Text>

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
    </Stack>
  );
};
