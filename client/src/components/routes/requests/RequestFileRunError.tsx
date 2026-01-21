import { Alert, Code } from "@mantine/core";

type Props = {
  error: Error;
};

export const RequestFileRunError = ({ error }: Props) => {
  return (
    <Alert color="red" title="Error running request file">
      <Code block>{error.message}</Code>
    </Alert>
  );
};
