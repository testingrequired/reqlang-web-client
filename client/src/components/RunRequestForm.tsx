import { ParseResult } from "reqlang-types";
import { formOptions, useForm, useStore } from "@tanstack/react-form";
import {
  Button,
  Card,
  Code,
  Select,
  Stack,
  Table,
  Text,
  TextInput,
} from "@mantine/core";
import { useFileStore } from "@/stores/loadedRequestFile";
import { useRunRequest } from "@/queries/parseReqlang";

type Props = {
  result: ParseResult;
};

export const RunRequestForm: React.FC<Props> = ({ result }) => {
  const fileStore = useFileStore();
  const runRequest = useRunRequest();

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
        reqfile: fileStore.file?.text ?? "",
        prompts,
        secrets,
        vars,
        env: values.value.env,
      });
    },
  });

  const selectedEnv = useStore(form.store, (state) => state.values.env);
  const envVarValues = result.full.config?.[0].envs?.[selectedEnv];

  const requestSpan = result.full.request[1];
  const requestText = fileStore.file?.text.slice(
    requestSpan.start,
    requestSpan.end
  );

  const responseSpan = result.full.response?.[1];
  const responseText = fileStore.file?.text.slice(
    responseSpan?.start,
    responseSpan?.end
  );

  if (runRequest.isError) {
    return <div>An error occurred: {runRequest.error.message}</div>;
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
        <Card>
          <Text mb={0} pb={0}>
            Request
          </Text>
          <Code block>{requestText}</Code>
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

              {Object.keys(envVarValues || {}).length > 0 && (
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

        <Button type="submit" disabled={runRequest.isPending}>
          Run Request
        </Button>

        {runRequest.isSuccess && (
          <Card>
            <Text mb={0} pb={0}>
              Actual Response
            </Text>
            <Code block>{runRequest.data[1]}</Code>
          </Card>
        )}

        {responseSpan && (
          <Card>
            <Text mb={0} pb={0}>
              Expected Response
            </Text>
            <Code block>{responseText}</Code>
          </Card>
        )}
      </Stack>
    </form>
  );
};
