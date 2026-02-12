import { useForm } from "@tanstack/react-form";
import {
  TextInput,
  Select,
  Textarea,
  Button,
  Group,
  Stack,
  Card,
  Divider,
  ActionIcon,
  Text,
} from "@mantine/core";
import { IconPlus, IconTrash } from "@tabler/icons-react";
import { HttpRequest } from "reqlang-types";
import { useEffect } from "react";

type Props = {
  value: HttpRequest;
  onChange?: (request: HttpRequest) => void;
};

function hasNoRequestBody(verb: string): boolean {
  return verb === "GET" || verb === "DELETE";
}

export function EditHttpRequestForm({ onChange, value }: Props) {
  const form = useForm({
    defaultValues: value,
    listeners: {
      async onChange(form) {
        if (
          hasNoRequestBody(form.formApi.state.values.verb) ||
          form.formApi.state.values.body?.length === 0
        ) {
          form.formApi.setFieldValue("body", null);
        }

        onChange?.(form.formApi.state.values);
      },
    },
  });

  useEffect(() => {
    form.reset(value);
  }, [value]);

  return (
    <Card>
      <Text fw="bold" mb="xl">
        HTTP Request
      </Text>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
      >
        <Stack gap="md">
          <Group grow>
            <form.Field
              name="verb"
              children={(field) => (
                <Select
                  label="Method"
                  data={["GET", "POST", "PUT", "PATCH", "DELETE"]}
                  value={field.state.value}
                  onChange={(value) => field.handleChange(value ?? "GET")}
                />
              )}
            />

            <form.Field
              name="target"
              children={(field) => (
                <TextInput
                  label="URL"
                  required
                  placeholder="https://api.example.com/resource"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.currentTarget.value)}
                />
              )}
            />

            <form.Field
              name="http_version"
              children={(field) => (
                <Select
                  label="HTTP Version"
                  data={["1.1", "2.0"]}
                  value={field.state.value}
                  onChange={(value) => field.handleChange(value ?? "1.1")}
                />
              )}
            />
          </Group>

          <Divider label="Headers" labelPosition="center" />

          <form.Field name="headers">
            {(field) => (
              <Stack gap="xs">
                {field.state.value.map((_, index) => (
                  <Group key={index} align="end" wrap="nowrap">
                    <TextInput
                      label={index === 0 ? "Header" : undefined}
                      placeholder="content-type"
                      required
                      value={field.state.value[index][0]}
                      onChange={(e) => {
                        const next = [...field.state.value];
                        next[index] = [e.currentTarget.value, next[index][1]];

                        field.handleChange(next);
                      }}
                      style={{ flex: 1 }}
                    />

                    <TextInput
                      label={index === 0 ? "Value" : undefined}
                      placeholder="application/json"
                      value={field.state.value[index][1]}
                      required
                      onChange={(e) => {
                        let next = [...field.state.value];
                        next[index] = [next[index][0], e.currentTarget.value];

                        field.handleChange(next);
                      }}
                      style={{ flex: 2 }}
                    />

                    <ActionIcon
                      color="red"
                      variant="subtle"
                      onClick={() => {
                        const next = field.state.value.filter(
                          (_, i) => i !== index,
                        );
                        field.handleChange(next.length ? next : []);
                      }}
                    >
                      <IconTrash size={16} />
                    </ActionIcon>
                  </Group>
                ))}

                <Button
                  variant="light"
                  leftSection={<IconPlus size={16} />}
                  onClick={() =>
                    field.handleChange([...field.state.value, ["", ""]])
                  }
                >
                  Add header
                </Button>
              </Stack>
            )}
          </form.Field>

          <form.Subscribe>
            {(update) => {
              if (hasNoRequestBody(update.values.verb)) return null;

              return (
                <>
                  <Divider label="Body" labelPosition="center" />
                  <form.Field
                    name="body"
                    children={(field) => (
                      <Textarea
                        label="Body"
                        placeholder=""
                        minRows={6}
                        autosize
                        value={field.state.value ?? ""}
                        onChange={(e) =>
                          field.handleChange(e.currentTarget.value)
                        }
                      />
                    )}
                  />
                </>
              );
            }}
          </form.Subscribe>
        </Stack>
      </form>
    </Card>
  );
}
