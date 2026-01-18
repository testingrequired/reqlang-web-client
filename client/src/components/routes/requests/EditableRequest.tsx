import { ParseResult } from "reqlang-types";
import { ReactNode, useEffect, useState } from "react";
import { getRequestFromRequestFile } from "@/services/requestFile";
import { Button, ButtonGroup, Loader, Stack, Textarea } from "@mantine/core";
import { useGetFileQuery, useUpdateFileMutation } from "@/queries/files";
import { useParsedRequestFileQuery } from "@/queries/parse";
import { CopyCode } from "@/components/common/CopyCode";
import { RequestFileError } from "./RequestFileError";

type Props = {
  requestFilePath: string;
  isEditing: boolean;
  onIsEditingChange: (isEditing: boolean) => void;
  renderText?: (text: string) => ReactNode;
};

export const EditableRequest = ({
  requestFilePath,
  isEditing,
  onIsEditingChange,
  renderText,
}: Props) => {
  const [editContent, setEditContent] = useState<string | undefined>(undefined);
  const updateFileMutation = useUpdateFileMutation(requestFilePath);
  const requestFileContentQuery = useGetFileQuery(requestFilePath);
  const parsedRequestFileQuery = useParsedRequestFileQuery(requestFilePath);

  useEffect(() => {
    if (parsedRequestFileQuery.data && requestFileContentQuery.data) {
      setEditContent(
        getRequestFromRequestFile(
          parsedRequestFileQuery.data as ParseResult,
          requestFileContentQuery.data as string
        )
      );
    }
  }, [parsedRequestFileQuery.data, requestFileContentQuery.data]);

  if (requestFileContentQuery.isError || parsedRequestFileQuery.isError) {
    return (
      <RequestFileError
        fileContentError={requestFileContentQuery.error}
        fileParseError={parsedRequestFileQuery.error}
      />
    );
  }

  if (
    requestFileContentQuery.isPending ||
    parsedRequestFileQuery.isPending ||
    updateFileMutation.isPending
  ) {
    return <Loader />;
  }

  const requestText = getRequestFromRequestFile(
    parsedRequestFileQuery.data,
    requestFileContentQuery.data!
  );

  const codeText = renderText ? renderText(requestText) : requestText;

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
                setEditContent(requestText);
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
          <CopyCode text={requestText}>{codeText}</CopyCode>
        </div>
      )}
    </>
  );
};
