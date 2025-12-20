import { ParseResult, RequestParamsFromClient } from "reqlang-types";
import { formOptions, useForm, useStore } from "@tanstack/react-form";
import {
  Alert,
  Button,
  Card,
  Loader,
  Select,
  Stack,
  Table,
  Text,
  TextInput,
} from "@mantine/core";
import { useEffect, useState } from "react";
import { useRunRequestMutation } from "@/queries/runRequest";
import { useExportRequestQuery } from "@/queries/export";
import { CopyCode } from "./CopyCode";

type Props = {
  result: ParseResult;
  requestFilePath: string;
  requestFileText: string;
};

export const RunRequestForm: React.FC<Props> = ({
  result,
  requestFilePath,
  requestFileText,
}) => {
  const runRequestMutation = useRunRequestMutation();
  const [params, setParams] = useState<RequestParamsFromClient | null>(null);
  const exportRequest = useExportRequestQuery(requestFilePath, params);

  useEffect(() => {
    if (params === null) {
      return;
    }

    runRequestMutation.mutate({
      request_file_path: requestFilePath,
      params,
    });
  }, [params]);

  const form = useForm({
    ...formOptions({
      defaultValues: Object.fromEntries([
        ["env", result.envs.length === 1 ? result.envs.at(0) : undefined],
        ...result.secrets.map((secret) => [`secret-${secret}`, ""]),
        ...result.prompts.map((prompt) => [
          `prompt-${prompt}`,
          result.default_prompt_values[prompt] ?? "",
        ]),
      ]) as Record<string, string>,
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

      const vars = result.full.config?.[0].envs?.[selectedEnv] ?? {};

      const params = {
        reqfile: requestFileText,
        prompts,
        secrets,
        vars,
        env: values.value.env,
        provider_values: {},
      };

      setParams(params);
    },
  });

  const selectedEnv = useStore(form.store, (state) => state.values.env);
  const envVarValues = result.full.config?.[0].envs?.[selectedEnv];

  const responseSpan = result.full.response?.[1];
  const responseText = requestFileText.slice(
    responseSpan?.start,
    responseSpan?.end
  );

  if (runRequestMutation.isError) {
    return <div>An error occurred: {runRequestMutation.error.message}</div>;
  }

  if (exportRequest.isError) {
    return <div>An error occurred: {exportRequest.error.message}</div>;
  }

  if (exportRequest.isPending) {
    return <Loader />;
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();

        form.handleSubmit(e);
      }}
    >
      <Stack>
        {result.envs.length > 0 && (
          <Card>
            <Stack>
              <form.Field
                name="env"
                children={(field) => (
                  <Select
                    label="Environment"
                    required={result.envs.length > 1}
                    disabled={result.envs.length === 1}
                    data={result.envs}
                    value={field.state.value}
                    onChange={(value) => {
                      if (value !== null) {
                        field.setValue(value);
                      }
                    }}
                  />
                )}
              />

              {Object.keys(envVarValues || {}).length > 0 ? (
                <Table>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Variable</Table.Th>
                      <Table.Th>Value</Table.Th>
                    </Table.Tr>
                  </Table.Thead>

                  <Table.Tbody>
                    {Object.entries(envVarValues || {}).map(([key, value]) => (
                      <Table.Tr>
                        <Table.Td>{key}</Table.Td>
                        <Table.Td>{value}</Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              ) : (
                result.vars.length > 0 && (
                  <>
                    <Alert>Select an environment to view variable values</Alert>
                    <Table>
                      <Table.Thead>
                        <Table.Tr>
                          <Table.Th>Variable</Table.Th>
                          <Table.Th>Value</Table.Th>
                        </Table.Tr>
                      </Table.Thead>

                      <Table.Tbody>
                        {result.vars.map((key) => {
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
              )}
            </Stack>
          </Card>
        )}

        {result.prompts.length > 0 && (
          <Card>
            <Text>Prompts</Text>
            {result.prompts.map((prompts, i) => (
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

        {result.secrets.length > 0 && (
          <Card>
            <Text>Secrets</Text>
            {result.secrets.map((secret, i) => (
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

        <Button type="submit" loading={runRequestMutation.isPending}>
          Run Request
        </Button>

        {runRequestMutation.isSuccess && exportRequest.isSuccess && (
          <>
            <Text mb={0} size="xl" fw="bold">
              Results
            </Text>
            <Card>
              <Text pb={0} fw="bold">
                Request
              </Text>
              <CopyCode text={exportRequest.data!}>
                {exportRequest.data}
              </CopyCode>
            </Card>

            <Card>
              <Text pb={0} fw="bold">
                {responseSpan ? "Actual Response" : "Response"}
              </Text>
              <CopyCode text={runRequestMutation.data[1]}>
                {runRequestMutation.data[1]}
              </CopyCode>

              <Stack>
                <Text size="sm">
                  Time Taken: {runRequestMutation.data[0].time_taken} ms
                </Text>
              </Stack>
            </Card>

            {responseSpan && (
              <>
                {!runRequestMutation.data[0].test_result.pass ? (
                  <>
                    <Alert color="red" title="Test Result: Failed!" w="100%">
                      <CopyCode
                        text={runRequestMutation.data[0].test_result.diff!}
                      >
                        {runRequestMutation.data[0].test_result.diff}
                      </CopyCode>
                    </Alert>
                  </>
                ) : (
                  <Alert color="green" title="Test Result: Passed!"></Alert>
                )}

                <Card>
                  <Text pb={0} fw="bold">
                    Expected Response
                  </Text>

                  <CopyCode text={responseText}>{responseText}</CopyCode>
                </Card>
              </>
            )}
          </>
        )}
      </Stack>
    </form>
  );
};
