import { CopyCode } from "@/components/common/CopyCode";
import { EditableRequest } from "@/components/routes/requests/EditableRequest";
import { RequestRunHistory } from "@/components/routes/requests/RequestRunHistory";
import { RunRequestForm } from "@/components/routes/requests/RunRequestForm";
import { useGetFileQuery } from "@/queries/files";
import { useParsedRequestFileMutation } from "@/queries/parse";
import { ActionIcon, Card, Loader, Stack, Tabs, Tooltip } from "@mantine/core";
import { IconRefresh } from "@tabler/icons-react";
import { useState } from "react";
import { ParseResult } from "reqlang-types";
import { RequestFileError } from "@/components/routes/requests/RequestFileError";

type Props = {
  requestFilePath: string;
};

export const ActiveRequestFile = ({ requestFilePath }: Props) => {
  const [isEditing, setIsEditing] = useState(false);
  const requestFileContentQuery = useGetFileQuery(requestFilePath);
  const parsedRequestFileMutation =
    useParsedRequestFileMutation(requestFilePath);

  if (requestFileContentQuery.isError || parsedRequestFileMutation.isError) {
    return <RequestFileError />;
  }

  if (
    requestFileContentQuery.isPending ||
    parsedRequestFileMutation.isPending
  ) {
    return <Loader />;
  }

  const shouldDisplayRequestTabs =
    typeof parsedRequestFileMutation.data !== "undefined" && !isEditing;

  return (
    <Stack data-testid="active-request-file">
      <Card data-testid="request-body-template" p="xs">
        <EditableRequest
          requestFilePath={requestFilePath}
          isEditing={isEditing}
          onIsEditingChange={setIsEditing}
        />
      </Card>

      {shouldDisplayRequestTabs && (
        <>
          <Tabs defaultValue="run">
            <Tabs.List>
              <Tabs.Tab value="run">Run</Tabs.Tab>
              <Tabs.Tab value="history">History</Tabs.Tab>
              <Tabs.Tab value="file">File</Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="run" p="md" aria-level={2}>
              <RunRequestForm
                parseResult={parsedRequestFileMutation.data as ParseResult}
                requestFilePath={requestFilePath}
                requestFileText={requestFileContentQuery.data as string}
              />
            </Tabs.Panel>

            <Tabs.Panel value="history" p="md" aria-level={2}>
              <RequestRunHistory requestFilePath={requestFilePath} />
            </Tabs.Panel>

            <Tabs.Panel value="file" p="md" aria-level={2}>
              <Card>
                <CopyCode text={requestFileContentQuery.data as string}>
                  {requestFileContentQuery.data as string}
                </CopyCode>

                <Tooltip label="Reload Request File">
                  <ActionIcon
                    color="dark"
                    variant="filled"
                    aria-label="Reload Request File"
                    onClick={() => {
                      requestFileContentQuery.refetch();
                    }}
                  >
                    <IconRefresh stroke={1} />
                  </ActionIcon>
                </Tooltip>
              </Card>
            </Tabs.Panel>
          </Tabs>
        </>
      )}
    </Stack>
  );
};
