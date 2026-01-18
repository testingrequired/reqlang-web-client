import { Alert, Code } from "@mantine/core";

type Props = {
  fileContentError: Error | null;
  fileParseError: Error | null;
};

export const RequestFileError = ({
  fileContentError,
  fileParseError,
}: Props) => {
  if (fileContentError) {
    return (
      <Alert color="red" title="Error loading request file">
        <Code block>{JSON.stringify(fileContentError.cause, null, 2)}</Code>
      </Alert>
    );
  }

  if (fileParseError) {
    return (
      <Alert color="red" title="Error parsing request file">
        <Code block>{JSON.stringify(fileParseError.cause, null, 2)}</Code>
      </Alert>
    );
  }

  return <Alert color="red">Error loading or parsing request file</Alert>;
};
