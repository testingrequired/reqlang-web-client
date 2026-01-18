import { ParseResult } from "reqlang-types";
import { useEffect, useState } from "react";
import { getRequestFromRequestFile } from "@/services/requestFile";
import {
  Alert,
  Button,
  ButtonGroup,
  Loader,
  Stack,
  Textarea,
} from "@mantine/core";
import { RequestFromRequestFile } from "@/components/RequestFromRequestFile";
import { useGetFileQuery, useUpdateFileMutation } from "@/queries/files";
import { useParsedRequestFileMutation } from "@/queries/parse";

type Props = {
  requestFilePath: string;
  isEditing: boolean;
  onIsEditingChange: (isEditing: boolean) => void;
};

export const EditableRequestFromRequestFile = ({
  requestFilePath,
  isEditing,
  onIsEditingChange,
}: Props) => {
  const [editContent, setEditContent] = useState<string | undefined>(undefined);
  const updateFileMutation = useUpdateFileMutation(requestFilePath);
  const requestFileContentQuery = useGetFileQuery(requestFilePath);
  const parsedRequestFileMutation =
    useParsedRequestFileMutation(requestFilePath);

  useEffect(() => {
    if (parsedRequestFileMutation.data && requestFileContentQuery.data) {
      setEditContent(
        getRequestFromRequestFile(parseResult, requestFileContent)
      );
    }
  }, [parsedRequestFileMutation.data, requestFileContentQuery.data]);

  if (requestFileContentQuery.isError || parsedRequestFileMutation.isError) {
    return <Alert color="red">Error loading or parsing request file</Alert>;
  }

  if (
    requestFileContentQuery.isPending ||
    parsedRequestFileMutation.isPending ||
    updateFileMutation.isPending
  ) {
    return <Loader />;
  }

  const parseResult: ParseResult =
    parsedRequestFileMutation.data as ParseResult;

  const requestFileContent = requestFileContentQuery.data as string;

  return (
    <>
      {isEditing ? (
        <Stack>
          <Textarea
            value={editContent!}
            onChange={(e) => {
              setEditContent(e.target.value);
            }}
            autosize
            autoFocus
            styles={{
              input: {
                fontFamily: "var(--mantine-font-family-monospace)",
                fontSize: "var(--mantine-font-size-xs)",
                padding: "var(--mantine-spacing-xs)",
              },
            }}
          />

          <ButtonGroup>
            <Button
              onClick={() => {
                onIsEditingChange(false);
                updateFileMutation.mutate({
                  updated_http_request: editContent ?? null,
                });
              }}
            >
              Save
            </Button>
            <Button
              color="red"
              onClick={() => {
                onIsEditingChange(false);
                setEditContent(
                  getRequestFromRequestFile(parseResult, requestFileContent)
                );
              }}
            >
              Cancel
            </Button>
          </ButtonGroup>
        </Stack>
      ) : (
        <div
          onClick={() => {
            onIsEditingChange(true);
          }}
        >
          <RequestFromRequestFile
            parseResult={parseResult}
            requestFileText={requestFileContent}
          />
        </div>
      )}
    </>
  );
};
