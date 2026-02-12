import { useForm } from "@tanstack/react-form";
import {
  TextInput,
  Select,
  Textarea,
  Button,
  Group,
  Stack,
  Card,
  ActionIcon,
  NumberInput,
  Text,
} from "@mantine/core";
import { IconPlus, IconTrash } from "@tabler/icons-react";
import { HttpResponse } from "reqlang-types";
import { useEffect } from "react";

type Props = {
  value: HttpResponse;
  onChange?: (response: HttpResponse) => void;
};

export function EditHttpResponseForm({ value, onChange }: Props) {
  const form = useForm({
    defaultValues: value,
    listeners: {
      async onChange(form) {
        if (form.formApi.state.values.body?.length === 0) {
          form.formApi.state.values.body = null;
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
        HTTP Response Assertion
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
              name="status_code"
              children={(field) => (
                <NumberInput
                  label="Status Code"
                  min={100}
                  max={599}
                  required
                  value={field.state.value}
                  onChange={(value) =>
                    field.handleChange((value as number) ?? 200)
                  }
                />
              )}
            />

            <form.Field
              name="status_text"
              children={(field) => (
                <TextInput
                  label="Status Text"
                  placeholder="OK"
                  required
                  value={field.state.value ?? ""}
                  onChange={(e) =>
                    field.handleChange(e.currentTarget.value || "")
                  }
                />
              )}
            />

            <form.Field
              name="http_version"
              children={(field) => (
                <Select
                  label="HTTP Version"
                  data={["1.1", "2.0"]}
                  required
                  value={field.state.value}
                  onChange={(value) => field.handleChange(value ?? "1.1")}
                />
              )}
            />
          </Group>

          <form.Field name="headers">
            {(field) => (
              <Stack>
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
                      required
                      value={field.state.value[index][1]}
                      onChange={(e) => {
                        const next = [...field.state.value];
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

                <Button.Group>
                  <Button
                    variant="light"
                    color="gray"
                    leftSection={<IconPlus size={16} />}
                    onClick={() =>
                      field.handleChange([...field.state.value, ["", ""]])
                    }
                  >
                    Add header
                  </Button>
                </Button.Group>
              </Stack>
            )}
          </form.Field>

          <form.Subscribe>
            {(f) => {
              return (
                <form.Field
                  name="body"
                  children={(field) => (
                    <>
                      {f.values.body?.length === 0 ? (
                        <Button.Group>
                          <Button
                            color="gray"
                            variant="light"
                            onClick={() => {
                              field.setValue(" ");
                            }}
                          >
                            Add Body
                          </Button>
                        </Button.Group>
                      ) : (
                        <>
                          <Textarea
                            label="Body"
                            minRows={6}
                            autosize
                            value={field.state.value ?? ""}
                            onChange={(e) =>
                              field.handleChange(e.currentTarget.value || null)
                            }
                          />

                          <Button.Group>
                            <Button
                              color="red"
                              variant="light"
                              onClick={() => {
                                field.setValue("");
                              }}
                            >
                              Remove Body
                            </Button>
                          </Button.Group>
                        </>
                      )}
                    </>
                  )}
                />
              );
            }}
          </form.Subscribe>
        </Stack>
      </form>
    </Card>
  );
}
