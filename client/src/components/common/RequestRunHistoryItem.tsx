import { useGetFileQuery } from "@/queries/files";
import { useParsedRequestFileQuery } from "@/queries/parse";
import { Alert, Code, Loader, Stack, Table, Text } from "@mantine/core";
import { RequestParamsFromClient } from "reqlang-types";
import { RequestRun } from "server-types";
import { CopyCode } from "./CopyCode";
import { useExportRequestMutation } from "@/queries/export";
import stripAnsi from "strip-ansi";
import { useEffect } from "react";

type Props = {
  requestRun: RequestRun;
};

export const RequestRunHistoryItem = ({ requestRun }: Props) => {
  const parseRequestFileMutation = useParsedRequestFileQuery(
    requestRun.request_file_path,
  );
  const fileQuery = useGetFileQuery(requestRun.request_file_path);
  const params: RequestParamsFromClient = JSON.parse(
    requestRun.params_from_client_json,
  );
  const exportRequestMutation = useExportRequestMutation();

  useEffect(() => {
    exportRequestMutation.mutate(params);
  }, [params]);

  if (
    parseRequestFileMutation.isPending ||
    fileQuery.isLoading ||
    typeof parseRequestFileMutation.data === "undefined" ||
    exportRequestMutation.isPending
  ) {
    return <Loader />;
  }

  if (parseRequestFileMutation.error || exportRequestMutation.isError) {
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

        <CopyCode text={exportRequestMutation.data!}>
          {exportRequestMutation.data}
        </CopyCode>
      </Stack>

      {params?.env && (
        <Stack gap="xs">
          <Text mb={0} fw="bold">
            Environment
          </Text>

          <Code p="sm">{params.env}</Code>
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
                    <Table.Td>
                      <Code>{key}</Code>
                    </Table.Td>
                    <Table.Td>
                      <Code>{params?.vars[key]}</Code>
                    </Table.Td>
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
                    <Table.Td>
                      <Code>{prompt}</Code>
                    </Table.Td>
                    <Table.Td>
                      <Code>{params?.prompts[prompt]}</Code>
                    </Table.Td>
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
                    <Table.Td>
                      <Code>{secret}</Code>
                    </Table.Td>
                    <Table.Td>
                      <Code>{params?.secrets[secret]}</Code>
                    </Table.Td>
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
                    <Table.Td>
                      <Code>{key}</Code>
                    </Table.Td>
                    <Table.Td>
                      <Code>{params?.provider_values[key!]}</Code>
                    </Table.Td>
                  </Table.Tr>
                );
              })}
            </Table.Tbody>
          </Table>
        ) : null}

        <Stack gap="md">
          <Text mb={0} fw="bold">
            Response
          </Text>

          <Text mb={0} size="sm">
            Response Time: {requestRun.response_at - requestRun.request_at}ms
          </Text>

          <CopyCode text={requestRun.response}>{requestRun.response}</CopyCode>
        </Stack>

        {result.full.response && (
          <>
            {requestRun.pass ? (
              <Alert color="green" title="Test Result: Passed!"></Alert>
            ) : (
              <Alert color="red" title="Test Result: Failed!" w="100%">
                <CopyCode text={stripAnsi(requestRun.diff?.trim() ?? "")}>
                  {stripAnsi(requestRun.diff?.trim() ?? "")}
                </CopyCode>
              </Alert>
            )}
          </>
        )}
      </Stack>
    </Stack>
  );
};
