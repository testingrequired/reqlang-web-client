import { ParseResult, RequestParamsFromClient } from "reqlang-types";
import { formOptions, useForm, useStore } from "@tanstack/react-form";
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
import { useEffect, useState } from "react";
import { useRunRequestMutation } from "@/queries/runRequest";
import { useExportRequestQuery } from "@/queries/export";
import { CopyCode } from "@/components/common/CopyCode";
import { useDisclosure } from "@mantine/hooks";

type Props = {
  parseResult: ParseResult;
  requestFilePath: string;
  requestFileText: string;
};

export const RunRequestForm: React.FC<Props> = ({
  parseResult,
  requestFilePath,
  requestFileText,
}) => {
  const runRequestMutation = useRunRequestMutation();
  const [params, setParams] = useState<RequestParamsFromClient | null>(null);
  const exportRequest = useExportRequestQuery(requestFilePath, params);
  const [isPreviewing, isPreviewingHandlers] = useDisclosure(false);

  useEffect(() => {
    if (params === null) {
      return;
    }

    if (!isPreviewing) {
      runRequestMutation.mutate({
        request_file_path: requestFilePath,
        params,
      });
    }
  }, [params]);

  const form = useForm({
    ...formOptions({
      defaultValues: Object.fromEntries([
        [
          "env",
          parseResult.envs.length === 1 ? parseResult.envs.at(0) : undefined,
        ],
        ...parseResult.secrets.map((secret) => [`secret-${secret}`, ""]),
        ...parseResult.prompts.map((prompt) => [
          `prompt-${prompt}`,
          parseResult.default_prompt_values[prompt] ?? "",
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

      const vars = parseResult.full.config?.[0].envs?.[selectedEnv] ?? {};

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
  const envVarValues = parseResult.full.config?.[0].envs?.[selectedEnv];

  const responseSpan = parseResult.full.response?.[1];
  const responseText = requestFileText.slice(
    responseSpan?.start,
    responseSpan?.end
  );

  if (exportRequest.isError) {
    return <div>An error occurred: {exportRequest.error.message}</div>;
  }

  if (exportRequest.isPending) {
    return <Loader />;
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
                parseResult.vars.length > 0 && (
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
              )}
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
          <Alert title="Error Running Request" color="red">
            {runRequestMutation.error.message}
          </Alert>
        )}

        <Group grow>
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

        {isPreviewing
          ? exportRequest.isSuccess &&
            exportRequest.data !== null && (
              <>
                <Text mb={0} size="xl" fw="bold">
                  Results
                </Text>
                <Card>
                  <Text pb={0} fw="bold">
                    Request
                  </Text>
                  <div data-testid="request-body-preview">
                    <CopyCode text={exportRequest.data!}>
                      {exportRequest.data}
                    </CopyCode>
                  </div>
                </Card>
              </>
            )
          : runRequestMutation.isSuccess &&
            exportRequest.isSuccess && (
              <>
                <Text mb={0} size="xl" fw="bold">
                  Results
                </Text>
                <Card>
                  <Text pb={0} fw="bold">
                    Request
                  </Text>
                  <div data-testid="request-body">
                    <CopyCode text={exportRequest.data!}>
                      {exportRequest.data}
                    </CopyCode>
                  </div>
                </Card>

                <Card>
                  <Text pb={0} fw="bold">
                    {responseSpan ? "Actual Response" : "Response"}
                  </Text>

                  <div data-testid="response-body">
                    <CopyCode text={runRequestMutation.data[1]}>
                      {runRequestMutation.data[1]}
                    </CopyCode>
                  </div>

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
                        <Alert
                          color="red"
                          title="Test Result: Failed!"
                          w="100%"
                        >
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
