import { createFormHookContexts, useForm } from "@tanstack/react-form";
import {
  Stack,
  Card,
  Text,
  TagsInput,
  Button,
  ActionIcon,
  TextInput,
  Group,
  Alert,
  ThemeIcon,
  Tooltip,
} from "@mantine/core";
import { useEffect } from "react";
import { ParsedConfig } from "reqlang-types";
import {
  IconExclamationCircle,
  IconPlus,
  IconQuestionMark,
  IconTrash,
} from "@tabler/icons-react";

export const { fieldContext, formContext, useFieldContext } =
  createFormHookContexts();

type Props = {
  value: ParsedConfig;
  onChange?: (config: ParsedConfig) => void;
};

export function EditConfigForm({ onChange, value }: Props) {
  const form = useForm({
    defaultValues: value,
    listeners: {
      async onChange(form) {
        if (Object.keys(form.formApi.state.values.envs ?? {}).length === 0) {
          form.formApi.setFieldValue("vars", []);
        }
        onChange?.(form.formApi.state.values);
      },
    },
  });

  useEffect(() => {
    form.reset(value);
  }, [value]);

  return (
    <Card data-testid="edit-config-form">
      <Text fw="bold" mb="xl">
        Config
      </Text>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
      >
        <Stack gap="md">
          <Card withBorder>
            <Stack gap="lg">
              <Group>
                <Text fw="bold" size="md" mb={0}>
                  Environments
                </Text>
                <Tooltip
                  label="Environments help manage environmental values using variables"
                  position="right"
                  color="dark"
                >
                  <ThemeIcon
                    size="xs"
                    autoContrast
                    style={{
                      cursor: "help",
                    }}
                  >
                    <IconQuestionMark stroke={2} />
                  </ThemeIcon>
                </Tooltip>
              </Group>
              <form.Field
                name="envs"
                children={(field) => (
                  <TagsInput
                    label="Environment Names"
                    data-testid="config-env-names"
                    placeholder="dev, qa, prod"
                    data={["dev", "qa", "prod"]}
                    clearable
                    value={
                      field.state.value ? Object.keys(field.state.value) : []
                    }
                    onChange={(value) => {
                      const next: Record<string, Record<string, string>> = {};

                      for (const v of value) {
                        next[v] =
                          (field.state.value?.[v] as Record<string, string>) ??
                          {};
                      }

                      return field.handleChange(next);
                    }}
                  />
                )}
              />

              <form.Subscribe>
                {(f) => {
                  if (f.values.vars?.length ?? 0 > 0)
                    return (
                      <form.Field name="envs">
                        {(envsField) => (
                          <Stack gap="md">
                            {Object.entries(envsField.state.value ?? {}).map(
                              ([envName, envVars]) => (
                                <Card key={envName} withBorder>
                                  <Text fw="bold">Environment: {envName}</Text>

                                  <form.Field name="vars">
                                    {(varsField) => (
                                      <Stack gap="xs">
                                        {varsField.state.value?.map(
                                          (variable, index) => {
                                            const varName = variable.name;

                                            return (
                                              <Group
                                                key={index}
                                                align="end"
                                                wrap="nowrap"
                                                data-testid={`env-${envName}-variable-${varName}`}
                                              >
                                                <TextInput
                                                  label={
                                                    index === 0
                                                      ? "Variable"
                                                      : undefined
                                                  }
                                                  value={varName}
                                                  style={{ flex: 1 }}
                                                  data-testid={`env-${envName}-variable-name-${varName}`}
                                                />

                                                <TextInput
                                                  label={
                                                    index === 0
                                                      ? "Value"
                                                      : undefined
                                                  }
                                                  placeholder=""
                                                  required
                                                  value={
                                                    envVars?.[varName] ?? ""
                                                  }
                                                  data-testid={`env-${envName}-variable-value-${varName}`}
                                                  onChange={(e) => {
                                                    const nextEnvs = {
                                                      ...(envsField.state
                                                        .value ?? {}),
                                                      [envName]: {
                                                        ...(envVars ?? {}),
                                                        [varName]:
                                                          e.target.value,
                                                      },
                                                    };

                                                    envsField.handleChange(
                                                      nextEnvs,
                                                    );
                                                  }}
                                                  style={{ flex: 2 }}
                                                />
                                              </Group>
                                            );
                                          },
                                        )}
                                      </Stack>
                                    )}
                                  </form.Field>
                                </Card>
                              ),
                            )}
                          </Stack>
                        )}
                      </form.Field>
                    );
                }}
              </form.Subscribe>
            </Stack>
          </Card>

          <Card withBorder>
            <Stack>
              <Group>
                <Text fw="bold" mb={0} size="md">
                  Variables
                </Text>
                <Tooltip
                  label="Variables can define a value for each environments"
                  position="right"
                  color="dark"
                >
                  <ThemeIcon
                    size="xs"
                    autoContrast
                    style={{
                      cursor: "help",
                    }}
                  >
                    <IconQuestionMark stroke={2} />
                  </ThemeIcon>
                </Tooltip>
              </Group>

              <form.Field name="vars">
                {(field) => (
                  <Stack gap="xs">
                    {field.state.value?.map((_, index) => {
                      return (
                        <Group
                          key={index}
                          align="end"
                          wrap="nowrap"
                          data-testid="variable"
                        >
                          <TextInput
                            label={index === 0 ? "Variable" : undefined}
                            placeholder=""
                            required
                            value={field.state.value?.[index].name}
                            onChange={(e) => {
                              let next = [...(field.state.value ?? [])];

                              next[index].name = e.target.value;

                              field.handleChange(next);
                            }}
                            style={{ flex: 1 }}
                            data-testid="variable-name"
                          />

                          <TextInput
                            label={index === 0 ? "Default Value" : undefined}
                            placeholder=""
                            value={field.state.value?.[index].default ?? ""}
                            onChange={(e) => {
                              let next = [...(field.state.value ?? [])];

                              next[index].default = e.target.value;

                              field.handleChange(next);
                            }}
                            style={{ flex: 2 }}
                            data-testid="variable-default-value"
                          />

                          <ActionIcon
                            color="red"
                            variant="subtle"
                            onClick={() => {
                              const next = field.state.value?.filter(
                                (_, i) => i !== index,
                              );
                              field.handleChange(next?.length ? next : []);
                            }}
                          >
                            <IconTrash size={16} />
                          </ActionIcon>
                        </Group>
                      );
                    })}

                    <form.Subscribe
                      children={(f) => {
                        return (
                          <>
                            {Object.keys(f.values.envs ?? {}).length === 0 ? (
                              <Alert
                                icon={
                                  <ThemeIcon
                                    size="sm"
                                    variant="transparent"
                                    color="gray"
                                  >
                                    <IconExclamationCircle stroke={1.5} />
                                  </ThemeIcon>
                                }
                                title="Add some environments first!"
                                variant="light"
                                color="gray"
                              >
                                <Text size="sm">
                                  You must have one or more environments before
                                  you can define variables.
                                </Text>
                                <Button.Group>
                                  <Button
                                    variant="light"
                                    color="gray"
                                    disabled={
                                      Object.keys(f.values.envs ?? {})
                                        .length === 0
                                    }
                                    leftSection={<IconPlus size={16} />}
                                    onClick={() =>
                                      field.handleChange([
                                        ...(field.state.value ?? []),
                                        { name: "", default: "" },
                                      ])
                                    }
                                  >
                                    Add variable
                                  </Button>
                                </Button.Group>
                              </Alert>
                            ) : (
                              <Button.Group>
                                <Button
                                  variant="light"
                                  color="gray"
                                  disabled={
                                    Object.keys(f.values.envs ?? {}).length ===
                                    0
                                  }
                                  leftSection={<IconPlus size={16} />}
                                  onClick={() =>
                                    field.handleChange([
                                      ...(field.state.value ?? []),
                                      { name: "", default: "" },
                                    ])
                                  }
                                >
                                  Add variable
                                </Button>
                              </Button.Group>
                            )}
                          </>
                        );
                      }}
                    />
                  </Stack>
                )}
              </form.Field>
            </Stack>
          </Card>

          <Card withBorder>
            <Stack>
              <Group>
                <Text fw="bold" mb={0} size="md">
                  Prompts
                </Text>
                <Tooltip
                  label="Define values prompted from the user at request time"
                  position="right"
                  color="dark"
                >
                  <ThemeIcon
                    size="xs"
                    autoContrast
                    style={{
                      cursor: "help",
                    }}
                  >
                    <IconQuestionMark stroke={2} />
                  </ThemeIcon>
                </Tooltip>
              </Group>

              <form.Field name="prompts">
                {(field) => (
                  <Stack gap="xs">
                    {field.state.value?.map((_, index) => {
                      return (
                        <Group
                          key={index}
                          align="end"
                          wrap="nowrap"
                          data-testid="prompt"
                        >
                          <TextInput
                            label={index === 0 ? "Prompt" : undefined}
                            placeholder=""
                            required
                            value={field.state.value?.[index].name}
                            onChange={(e) => {
                              let next = [...(field.state.value ?? [])];

                              next[index].name = e.target.value;

                              field.handleChange(next);
                            }}
                            style={{ flex: 1 }}
                            data-testid={`prompt-name`}
                          />

                          <TextInput
                            label={index === 0 ? "Default Value" : undefined}
                            placeholder=""
                            value={field.state.value?.[index].default ?? ""}
                            onChange={(e) => {
                              let next = [...(field.state.value ?? [])];

                              next[index].default = e.target.value;

                              field.handleChange(next);
                            }}
                            style={{ flex: 2 }}
                            data-testid={`prompt-name-default-value`}
                          />

                          <ActionIcon
                            color="red"
                            variant="subtle"
                            onClick={() => {
                              const next = field.state.value?.filter(
                                (_, i) => i !== index,
                              );
                              field.handleChange(next?.length ? next : []);
                            }}
                          >
                            <IconTrash size={16} />
                          </ActionIcon>
                        </Group>
                      );
                    })}

                    <Button.Group>
                      <Button
                        variant="light"
                        color="gray"
                        leftSection={<IconPlus size={16} />}
                        onClick={() =>
                          field.handleChange([
                            ...(field.state.value ?? []),
                            { name: "", default: "", description: null },
                          ])
                        }
                      >
                        Add prompt
                      </Button>
                    </Button.Group>
                  </Stack>
                )}
              </form.Field>
            </Stack>
          </Card>

          <Card withBorder>
            <Stack>
              <Group>
                <Text fw="bold" mb={0} size="md">
                  Secrets
                </Text>
                <Tooltip
                  label="Secret values retreived at request time"
                  position="right"
                  color="dark"
                >
                  <ThemeIcon
                    size="xs"
                    autoContrast
                    style={{
                      cursor: "help",
                    }}
                  >
                    <IconQuestionMark stroke={2} />
                  </ThemeIcon>
                </Tooltip>
              </Group>

              <form.Field
                name="secrets"
                children={(field) => (
                  <TagsInput
                    label="Secrets"
                    data-testid="config-secrets"
                    placeholder="alot, of, secret, values"
                    value={field.state.value ?? []}
                    onChange={(value) => field.handleChange(value)}
                    labelProps={{
                      style: {
                        display: "none",
                      },
                    }}
                  />
                )}
              />
            </Stack>
          </Card>
        </Stack>
      </form>
    </Card>
  );
}
