import { useForm } from "@tanstack/react-form";
import { TextInput, Stack, Card, Text } from "@mantine/core";
import { useEffect } from "react";

type Props = {
  value: {
    config: string;
  };
  onChange?: (request: { config: string }) => void;
};

export function EditConfigForm({ onChange, value }: Props) {
  const form = useForm({
    defaultValues: value,
    listeners: {
      async onChange(form) {
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
          <form.Field
            name="config"
            children={(field) => (
              <TextInput
                label="Config"
                required
                placeholder=""
                value={field.state.value}
                onChange={(e) => field.handleChange(e.currentTarget.value)}
              />
            )}
          />
        </Stack>
      </form>
    </Card>
  );
}
