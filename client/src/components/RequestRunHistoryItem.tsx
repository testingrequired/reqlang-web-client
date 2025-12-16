import { useGetFileQuery } from "@/queries/files";
import { useParsedRequestFileMutation } from "@/queries/parse";
import { Code, Highlight, Loader, Stack, Table, Text } from "@mantine/core";
import { useEffect, useState } from "react";
import { RequestParamsFromClient } from "reqlang-types";
import { RequestRun } from "server-types";
import { RequestFromRequestFile } from "./RequestFromRequestFile";
import { CopyCode } from "./CopyCode";

type Props = {
  requestRun: RequestRun;
};

export const RequestRunHistoryItem = ({ requestRun }: Props) => {
  const parseRequestFileMutation = useParsedRequestFileMutation();
  const fileQuery = useGetFileQuery(requestRun.request_file_path);
  const [highlightedReference, setHighlightedReference] = useState<string>("");
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

        <RequestFromRequestFile
          result={result}
          requestFileText={params.reqfile}
          renderText={(text: string) => (
            <Highlight highlight={highlightedReference} size="sm">
              {text}
            </Highlight>
          )}
        />
      </Stack>

      {params?.env && (
        <Stack gap="xs">
          <Text mb={0} fw="bold">
            Environment
          </Text>

          <Code
            p="sm"
            onMouseEnter={() => {
              setHighlightedReference(`{{@env}}`);
            }}
            onMouseLeave={() => {
              setHighlightedReference("");
            }}
            style={{
              cursor: "help",
            }}
          >
            {params.env}
          </Code>
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
                    <Table.Td
                      onMouseEnter={() => {
                        setHighlightedReference(`{{:${key}}}`);
                      }}
                      onMouseLeave={() => {
                        setHighlightedReference("");
                      }}
                      style={{
                        cursor: "help",
                      }}
                    >
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
                    <Table.Td
                      onMouseEnter={() => {
                        setHighlightedReference(`{{?${prompt}}}`);
                      }}
                      onMouseLeave={() => {
                        setHighlightedReference("");
                      }}
                      style={{
                        cursor: "help",
                      }}
                    >
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
                    <Table.Td
                      onMouseEnter={() => {
                        setHighlightedReference(`{{!${secret}}}`);
                      }}
                      onMouseLeave={() => {
                        setHighlightedReference("");
                      }}
                      style={{
                        cursor: "help",
                      }}
                    >
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
                    <Table.Td
                      onMouseEnter={() => {
                        setHighlightedReference(`{{@${key}}}`);
                      }}
                      onMouseLeave={() => {
                        setHighlightedReference("");
                      }}
                      style={{
                        cursor: "help",
                      }}
                    >
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

          <CopyCode text={requestRun.response}>{requestRun.response}</CopyCode>

          <Text mb={0} size="sm">
            Response Time: {requestRun.response_at - requestRun.request_at}ms
          </Text>
        </Stack>
      </Stack>
    </Stack>
  );
};
