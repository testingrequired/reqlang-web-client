import { Alert, Code } from "@mantine/core";

type Props = {
  error: Error;
};

export const RequestFileExportError = ({ error }: Props) => {
  return (
    <Alert color="red" title="Error exporting request file">
      <Code block>{error.message}</Code>
    </Alert>
  );
};
