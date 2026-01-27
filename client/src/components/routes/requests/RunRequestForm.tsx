import { ParseResult, RequestParamsFromClient } from "reqlang-types";
import { formOptions, useForm } from "@tanstack/react-form";
import {
  Alert,
  Button,
  Code,
  Fieldset,
  Group,
  Loader,
  Select,
  Space,
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
  const [isExporting, isExportingHandlers] = useDisclosure(false);
  const [exportFormat, setExportFormat] = useState<string>();

  const runRequestMutation = useRunRequestMutation();
  const exportRequestMutation = useExportRequestMutation();

  useEffect(() => {
    if (typeof runParams === "undefined") return;

    exportRequestMutation.mutate({
      params: runParams,
      format: exportFormat,
    });

    if (!isExporting) {
      runRequestMutation.mutate({
        request_file_path: requestFilePath,
        params: runParams,
      });
    }
  }, [runParams, exportFormat]);

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

      setExportFormat(
        isExporting ? values.value.exportRequestFormat : undefined,
      );

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

  useEffect(() => {
    if (!isExporting) {
      form.setFieldValue("exportRequestFormat", "http");
    }
  }, [isExporting]);

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
    if (isExporting) {
      runResultsComponent = (
        <RunRequestResults
          isExporting={isExporting}
          exportedRequest={exportRequestMutation.data}
        />
      );
    } else if (runRequestMutation.isSuccess) {
      runResultsComponent = (
        <RunRequestResults
          isExporting={isExporting}
          exportedRequest={exportRequestMutation.data}
          exportedResponse={runRequestMutation.data[1]}
          requestRunResponse={runRequestMutation.data[0]}
          expectedResponse={expectedResponseText}
        />
      );
    }
  }

  const handleExportingToggle = () => {
    exportRequestMutation.reset();
    isExportingHandlers.toggle();
  };

  return (
    <form
      data-testid="run-request-form"
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();

        form.handleSubmit(e);
      }}
    >
      <Stack gap="md">
        {parseResult.envs.length > 0 && (
          <Fieldset legend={<Text size="md">Variables</Text>} variant="filled">
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
                              <Table.Td>
                                <Code block>{value}</Code>
                              </Table.Td>
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
          </Fieldset>
        )}

        {parseResult.prompts.length > 0 && (
          <Fieldset legend={<Text size="md">Prompts</Text>} variant="filled">
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
          </Fieldset>
        )}

        {parseResult.secrets.length > 0 && (
          <Fieldset legend={<Text size="md">Secrets</Text>} variant="filled">
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
          </Fieldset>
        )}

        {!isExporting && runRequestMutation.isError && (
          <RequestFileRunError error={runRequestMutation.error} />
        )}

        <Group justify="space-between" mt="sm">
          <Button
            type="submit"
            loading={runRequestMutation.isPending}
            variant={isExporting ? "light" : "primary"}
          >
            {isExporting ? "Export" : "Run"}
          </Button>

          <Group>
            {isExporting && (
              <form.Field
                name="exportRequestFormat"
                children={(field) => (
                  <Select
                    placeholder="Export Format"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e ?? "http")}
                    data={["http", "curl"]}
                    comboboxProps={{
                      withinPortal: false,
                    }}
                  />
                )}
              />
            )}

            <Switch
              label="Export Request"
              checked={isExporting}
              onChange={handleExportingToggle}
              radius="sm"
            />
          </Group>
        </Group>

        <Space h="xs" />

        {runResultsComponent}
      </Stack>
    </form>
  );
};

export function getFormDefaultValues(
  parseResult: ParseResult,
): Record<string, string> {
  const env = [
    "env",
    parseResult.envs.length === 1 ? parseResult.envs.at(0) : undefined,
  ] as const;

  const secrets = parseResult.secrets.map(
    (secret) => [`secret-${secret}`, ""] as const,
  );

  const prompts = parseResult.prompts.map(
    (prompt) =>
      [
        `prompt-${prompt}`,
        parseResult.default_prompt_values[prompt] ?? "",
      ] as const,
  );

  const exportRequestFormat = ["exportRequestFormat", "http"] as const;

  return Object.fromEntries([
    env,
    ...secrets,
    ...prompts,
    exportRequestFormat,
  ] as const) as Record<string, string>;
}
