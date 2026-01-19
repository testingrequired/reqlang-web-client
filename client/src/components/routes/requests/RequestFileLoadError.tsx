import { Alert, Code } from "@mantine/core";

type Props = {
  error: Error;
};

export const RequestFileLoadError = ({ error }: Props) => {
  return (
    <Alert color="red" title="Error loading request file">
      <Code block>{JSON.stringify(error.cause, null, 2)}</Code>
    </Alert>
  );
};
