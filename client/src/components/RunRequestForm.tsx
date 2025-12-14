import { ParseResult } from "reqlang-types";
import { formOptions, useForm, useStore } from "@tanstack/react-form";
import {
  ActionIcon,
  Alert,
  Button,
  ButtonGroup,
  Card,
  Code,
  CopyButton,
  Select,
  Stack,
  Table,
  Text,
  TextInput,
  Tooltip,
} from "@mantine/core";
import {
  useDiffResponse,
  useExportRequest,
  useRunRequest,
} from "@/queries/parseReqlang";
import { useEffect } from "react";
import {
  IconCopy,
  IconCopyCheckFilled,
  IconRefresh,
} from "@tabler/icons-react";

type Props = {
  result: ParseResult;
  requestFilePath: string;
  requestFileText: string;
  refreshFile: () => void;
};

export const RunRequestForm: React.FC<Props> = ({
  result,
  requestFilePath,
  requestFileText,
  refreshFile,
}) => {
  const runRequest = useRunRequest();
  const diffResponse = useDiffResponse();
  const exportRequest = useExportRequest();

  useEffect(() => {
    if (typeof runRequest.data !== "undefined") {
      diffResponse.mutate({
        expected: result.full.response?.[0]!,
        actual: runRequest.data[0].response,
      });
    }
  }, [runRequest.data]);

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

      runRequest.mutate({
        request_file_path: requestFilePath,
        params: {
          reqfile: requestFileText,
          prompts,
          secrets,
          vars,
          env: values.value.env,
          provider_values: {},
        },
      });

      exportRequest.mutate({
        reqfile: requestFileText,
        prompts,
        secrets,
        vars,
        env: values.value.env,
        provider_values: {},
      });
    },
  });

  const selectedEnv = useStore(form.store, (state) => state.values.env);
  const envVarValues = result.full.config?.[0].envs?.[selectedEnv];

  const requestSpan = result.full.request[1];
  const requestText = requestFileText.slice(requestSpan.start, requestSpan.end);

  const responseSpan = result.full.response?.[1];
  const responseText = requestFileText.slice(
    responseSpan?.start,
    responseSpan?.end
  );

  if (runRequest.isError) {
    return <div>An error occurred: {runRequest.error.message}</div>;
  }

  if (diffResponse.isError) {
    return <div>An error occurred: {diffResponse.error.message}</div>;
  }

  if (exportRequest.isError) {
    return <div>An error occurred: {exportRequest.error.message}</div>;
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
        <Card p="xs">
          <Code block>{requestText}</Code>

          <ButtonGroup>
            <CopyButton value={requestText}>
              {({ copied, copy }) => (
                <Tooltip label="Copy">
                  <ActionIcon onClick={copy} color="dark" aria-label="Copy">
                    {copied ? (
                      <IconCopyCheckFilled stroke={1} />
                    ) : (
                      <IconCopy stroke={1} />
                    )}
                  </ActionIcon>
                </Tooltip>
              )}
            </CopyButton>

            <Tooltip label="Reload Request File">
              <ActionIcon
                color="dark"
                variant="filled"
                aria-label="Reload Request File"
                onClick={refreshFile}
              >
                <IconRefresh stroke={1} />
              </ActionIcon>
            </Tooltip>
          </ButtonGroup>
        </Card>

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

        <Button type="submit" loading={runRequest.isPending}>
          Run Request
        </Button>

        {runRequest.isSuccess && exportRequest.isSuccess && (
          <>
            <Text mb={0} size="xl" fw="bold">
              Results
            </Text>
            <Card>
              <Text mb={0} pb={0} fw="bold">
                Request
              </Text>
              <Code block>{exportRequest.data}</Code>

              <CopyButton value={exportRequest.data}>
                {({ copied, copy }) => (
                  <Tooltip label="Copy">
                    <ActionIcon onClick={copy} color="dark" aria-label="Copy">
                      {copied ? (
                        <IconCopyCheckFilled stroke={1} />
                      ) : (
                        <IconCopy stroke={1} />
                      )}
                    </ActionIcon>
                  </Tooltip>
                )}
              </CopyButton>
            </Card>

            <Card>
              <Text mb={0} pb={0} fw="bold">
                {responseSpan ? "Actual Response" : "Response"}
              </Text>
              <Code block>{runRequest.data[1]}</Code>

              <Stack>
                <CopyButton value={runRequest.data[1]}>
                  {({ copied, copy }) => (
                    <Tooltip label="Copy">
                      <ActionIcon onClick={copy} color="dark" aria-label="Copy">
                        {copied ? (
                          <IconCopyCheckFilled stroke={1} />
                        ) : (
                          <IconCopy stroke={1} />
                        )}
                      </ActionIcon>
                    </Tooltip>
                  )}
                </CopyButton>

                <Text size="sm">
                  Time Taken: {runRequest.data[0].time_taken} ms
                </Text>
              </Stack>
            </Card>

            {responseSpan && (
              <>
                {(diffResponse.data?.length ?? 0) > 0 ? (
                  <>
                    <Alert color="red" title="Test Result: Failed!">
                      <Code block>{diffResponse.data}</Code>

                      <CopyButton value={diffResponse.data ?? ""}>
                        {({ copied, copy }) => (
                          <Tooltip label="Copy">
                            <ActionIcon
                              onClick={copy}
                              color="dark"
                              aria-label="Copy"
                            >
                              {copied ? (
                                <IconCopyCheckFilled stroke={1} />
                              ) : (
                                <IconCopy stroke={1} />
                              )}
                            </ActionIcon>
                          </Tooltip>
                        )}
                      </CopyButton>
                    </Alert>
                  </>
                ) : (
                  <Alert color="green" title="Test Result: Passed!"></Alert>
                )}

                <Card>
                  <Text mb={0} pb={0} fw="bold">
                    Expected Response
                  </Text>

                  <Code block>{responseText}</Code>

                  <CopyButton value={responseText}>
                    {({ copied, copy }) => (
                      <Tooltip label="Copy">
                        <ActionIcon
                          onClick={copy}
                          color="dark"
                          aria-label="Copy"
                        >
                          {copied ? (
                            <IconCopyCheckFilled stroke={1} />
                          ) : (
                            <IconCopy stroke={1} />
                          )}
                        </ActionIcon>
                      </Tooltip>
                    )}
                  </CopyButton>
                </Card>
              </>
            )}
          </>
        )}
      </Stack>
    </form>
  );
};
