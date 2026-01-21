import { ParseResult } from "reqlang-types";
import { useEffect, useState } from "react";
import { getRequestFromRequestFile } from "@/services/requestFile";
import { Button, ButtonGroup, Loader, Stack, Textarea } from "@mantine/core";
import { useGetFileQuery, useUpdateFileMutation } from "@/queries/files";
import { useParsedRequestFileQuery } from "@/queries/parse";
import { CopyCode } from "@/components/common/CopyCode";
import { RequestFileLoadError } from "./RequestFileLoadError";
import { notifications } from "@mantine/notifications";
import { RequestFileUpdateError } from "./RequestFileUpdateError";

type Props = {
  requestFilePath: string;
  onEditModeChange: (isEditing: boolean) => void;
};

export const EditableRequest = ({
  requestFilePath,
  onEditModeChange: onIsEditingChange,
}: Props) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState<string | undefined>(undefined);
  const updateFileMutation = useUpdateFileMutation(requestFilePath);
  const requestFileContentQuery = useGetFileQuery(requestFilePath);
  const parsedRequestFileQuery = useParsedRequestFileQuery(requestFilePath);

  useEffect(() => {
    if (parsedRequestFileQuery.data && requestFileContentQuery.data) {
      setEditContent(
        getRequestFromRequestFile(
          parsedRequestFileQuery.data as ParseResult,
          requestFileContentQuery.data as string,
        ),
      );
    }
  }, [parsedRequestFileQuery.data, requestFileContentQuery.data]);

  if (requestFileContentQuery.isError) {
    return <RequestFileLoadError error={requestFileContentQuery.error} />;
  }

  if (parsedRequestFileQuery.isError) {
    return <RequestFileUpdateError error={parsedRequestFileQuery.error} />;
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
    requestFileContentQuery.data!,
  );

  const handleChangeEditContent = (
    e: React.ChangeEvent<HTMLTextAreaElement>,
  ) => {
    setEditContent(e.target.value);
  };

  const handleSave = () => {
    updateFileMutation.mutate(
      {
        updated_http_request: editContent ?? null,
      },
      {
        onSuccess: () => {
          onIsEditingChange(false);
          notifications.show({
            message: "Save successful",
          });
        },
      },
    );
  };

  const handleCancel = () => {
    setIsEditing(false);
    onIsEditingChange(false);
    setEditContent(requestText);
    updateFileMutation.reset();
  };

  const handleClickRequest = () => {
    setIsEditing(true);
    onIsEditingChange(true);
  };

  const requestInEditMode = (
    <Stack>
      <Textarea
        value={editContent!}
        onChange={handleChangeEditContent}
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
        <Button onClick={handleSave}>Save</Button>
        <Button color="red" onClick={handleCancel}>
          Cancel
        </Button>
      </ButtonGroup>

      {updateFileMutation.isError && (
        <RequestFileUpdateError error={updateFileMutation.error} />
      )}
    </Stack>
  );

  const requestInReadOnlyMode = (
    <CopyCode text={requestText} onClick={handleClickRequest}>
      {requestText}
    </CopyCode>
  );

  return isEditing ? requestInEditMode : requestInReadOnlyMode;
};
