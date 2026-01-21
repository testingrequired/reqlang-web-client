import { ParseResult, RequestParamsFromClient } from "reqlang-types";
import { formOptions, useForm } from "@tanstack/react-form";
import {
  Alert,
  Button,
  Card,
  Group,
  Loader,
  Select,
  Stack,
  Switch,
  Table,
  Text,
  TextInput,
} from "@mantine/core";
import { ReactNode, useEffect, useState } from "react";
import { useRunRequestMutation } from "@/queries/runRequest";
import { useExportRequestMutation } from "@/queries/export";
import { useDisclosure } from "@mantine/hooks";
import { useGetFileQuery } from "@/queries/files";
import { useParsedRequestFileQuery } from "@/queries/parse";
import { RequestFileLoadError } from "@/components/routes/requests/RequestFileLoadError";
import { RequestFileUpdateError } from "@/components/routes/requests/RequestFileUpdateError";
import { RequestFileRunError } from "@/components/routes/requests/RequestFileRunError";
import { RunRequestResults } from "@/components/routes/requests/RunRequestResults";
import { RequestFileExportError } from "@/components/routes/requests/RequestFileExportError";

type Props = {
  requestFilePath: string;
};

export const RunRequestForm: React.FC<Props> = ({ requestFilePath }) => {
  const getFileQuery = useGetFileQuery(requestFilePath);
  const parseFileMutation = useParsedRequestFileQuery(requestFilePath);

  if (getFileQuery.isPending || parseFileMutation.isPending) {
    return <Loader />;
  }

  if (getFileQuery.isError) {
    return <RequestFileLoadError error={getFileQuery.error} />;
  }

  if (parseFileMutation.isError) {
    return <RequestFileUpdateError error={parseFileMutation.error} />;
  }

  return (
    <RunRequestFormInner
      requestFilePath={requestFilePath}
      parseResult={parseFileMutation.data}
      requestFileText={getFileQuery.data!}
    />
  );
};

type InnerProps = {
  parseResult: ParseResult;
  requestFilePath: string;
  requestFileText: string;
};

const RunRequestFormInner = ({
  parseResult,
  requestFilePath,
  requestFileText,
}: InnerProps) => {
  const [runParams, setRunParams] = useState<RequestParamsFromClient>();
  const [isPreviewing, isPreviewingHandlers] = useDisclosure(false);

  const runRequestMutation = useRunRequestMutation();
  const exportRequestMutation = useExportRequestMutation();

  useEffect(() => {
    if (typeof runParams === "undefined") return;

    exportRequestMutation.mutate(runParams);

    if (!isPreviewing) {
      runRequestMutation.mutate({
        request_file_path: requestFilePath,
        params: runParams,
      });
    }
  }, [runParams]);

  const envs = parseResult.full.config?.[0].envs;
  const defaultValues = getFormDefaultValues(parseResult);

  const form = useForm({
    ...formOptions({
      defaultValues,
    }),
    onSubmit: async (values) => {
      const secrets: Record<string, string> = {};
      const prompts: Record<string, string> = {};

      for (const [key, value] of Object.entries(values.value)) {
        if (key.startsWith("secret-")) {
          secrets[key.slice(7)] = value;
        }

        if (key.startsWith("prompt-")) {
          prompts[key.slice(7)] = value;
        }
      }

      const vars = envs?.[values.value.env] ?? {};

      setRunParams({
        reqfile: requestFileText,
        prompts,
        secrets,
        vars,
        env: values.value.env,
        provider_values: {},
      });
    },
  });

  if (exportRequestMutation.isPending) {
    return <Loader />;
  }

  if (exportRequestMutation.isError) {
    return <RequestFileExportError error={exportRequestMutation.error} />;
  }

  const expectedResponseSpan = parseResult.full.response?.[1];
  const expectedResponseText =
    expectedResponseSpan &&
    requestFileText.slice(
      expectedResponseSpan?.start,
      expectedResponseSpan?.end,
    );

  let runResultsComponent: ReactNode;

  if (exportRequestMutation.isSuccess) {
    if (isPreviewing) {
      runResultsComponent = (
        <RunRequestResults
          isPreview={isPreviewing}
          exportedRequest={exportRequestMutation.data}
        />
      );
    } else if (runRequestMutation.isSuccess) {
      runResultsComponent = (
        <RunRequestResults
          isPreview={isPreviewing}
          exportedRequest={exportRequestMutation.data}
          exportedResponse={runRequestMutation.data[1]}
          requestRunResponse={runRequestMutation.data[0]}
          expectedResponse={expectedResponseText}
        />
      );
    }
  }

  return (
    <form
      data-testid="run-request-form"
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();

        form.handleSubmit(e);
      }}
    >
      <Stack>
        {parseResult.envs.length > 0 && (
          <Card>
            <Stack>
              <form.Field
                name="env"
                children={(field) => (
                  <Select
                    label="Environment"
                    required={parseResult.envs.length > 1}
                    disabled={parseResult.envs.length === 1}
                    data={parseResult.envs}
                    value={field.state.value}
                    onChange={(value) => {
                      if (value !== null) {
                        field.setValue(value);
                      }
                    }}
                  />
                )}
              />

              <form.Subscribe
                selector={(state) => state.values.env}
                children={(selectedEnv) => {
                  const envVarValues = envs?.[selectedEnv];

                  return Object.keys(envVarValues || {}).length > 0 ? (
                    <Table>
                      <Table.Thead>
                        <Table.Tr>
                          <Table.Th>Variable</Table.Th>
                          <Table.Th>Value</Table.Th>
                        </Table.Tr>
                      </Table.Thead>

                      <Table.Tbody>
                        {Object.entries(envVarValues || {}).map(
                          ([key, value]) => (
                            <Table.Tr>
                              <Table.Td>{key}</Table.Td>
                              <Table.Td>{value}</Table.Td>
                            </Table.Tr>
                          ),
                        )}
                      </Table.Tbody>
                    </Table>
                  ) : (
                    parseResult.vars.length > 0 && (
                      <>
                        <Alert>
                          Select an environment to view variable values
                        </Alert>
                        <Table>
                          <Table.Thead>
                            <Table.Tr>
                              <Table.Th>Variable</Table.Th>
                              <Table.Th>Value</Table.Th>
                            </Table.Tr>
                          </Table.Thead>

                          <Table.Tbody>
                            {parseResult.vars.map((key) => {
                              return (
                                <Table.Tr>
                                  <Table.Td>{key}</Table.Td>
                                  <Table.Td>...</Table.Td>
                                </Table.Tr>
                              );
                            })}
                          </Table.Tbody>
                        </Table>
                      </>
                    )
                  );
                }}
              />
            </Stack>
          </Card>
        )}

        {parseResult.prompts.length > 0 && (
          <Card>
            <Text>Prompts</Text>
            {parseResult.prompts.map((prompts, i) => (
              <form.Field
                name={`prompt-${prompts}`}
                key={i}
                validators={{
                  onMount: ({ value }) =>
                    value.length === 0 ? "This field is required" : undefined,
                  onChange: ({ value }) =>
                    value.length === 0 ? "This field is required" : undefined,
                }}
                children={(field) => (
                  <TextInput
                    label={prompts}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    required
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                )}
              />
            ))}
          </Card>
        )}

        {parseResult.secrets.length > 0 && (
          <Card>
            <Text>Secrets</Text>
            {parseResult.secrets.map((secret, i) => (
              <form.Field
                name={`secret-${secret}`}
                key={i}
                validators={{
                  onMount: ({ value }) =>
                    value.length === 0 ? "This field is required" : undefined,
                  onChange: ({ value }) =>
                    value.length === 0 ? "This field is required" : undefined,
                }}
                children={(field) => (
                  <TextInput
                    label={secret}
                    value={field.state.value}
                    required
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                )}
              />
            ))}
          </Card>
        )}

        {!isPreviewing && runRequestMutation.isError && (
          <RequestFileRunError error={runRequestMutation.error} />
        )}

        <Group>
          <Button type="submit" loading={runRequestMutation.isPending}>
            {isPreviewing ? "Run (Preview)" : "Run"}
          </Button>

          <Switch
            label="Preview Request"
            checked={isPreviewing}
            onChange={isPreviewingHandlers.toggle}
            radius="sm"
          />
        </Group>

        {runResultsComponent}
      </Stack>
    </form>
  );
};

function getFormDefaultValues(
  parseResult: ParseResult,
): Record<string, string> {
  return Object.fromEntries([
    ["env", parseResult.envs.length === 1 ? parseResult.envs.at(0) : undefined],
    ...parseResult.secrets.map((secret) => [`secret-${secret}`, ""]),
    ...parseResult.prompts.map((prompt) => [
      `prompt-${prompt}`,
      parseResult.default_prompt_values[prompt] ?? "",
    ]),
  ]) as Record<string, string>;
}
