import { Alert, Code } from "@mantine/core";

type Props = {
  error: Error;
};

export const RequestFilParseError = ({ error }: Props) => {
  return (
    <Alert color="red" title="Error parsing request file">
      <Code block>{JSON.stringify(error.cause, null, 2)}</Code>
    </Alert>
  );
};
