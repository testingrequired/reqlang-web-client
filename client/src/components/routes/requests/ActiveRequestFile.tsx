import { CopyCode } from "@/components/common/CopyCode";
import { EditableRequest } from "@/components/routes/requests/EditableRequest";
import { RequestRunHistory } from "@/components/routes/requests/RequestRunHistory";
import { RunRequestForm } from "@/components/routes/requests/RunRequestForm";
import { useGetFileQuery } from "@/queries/files";
import { ActionIcon, Card, Loader, Stack, Tabs, Tooltip } from "@mantine/core";
import { IconRefresh } from "@tabler/icons-react";
import { useState } from "react";
import { RequestFileLoadError } from "@/components/routes/requests/RequestFileLoadError";

type Props = {
  requestFilePath: string;
};

export const ActiveRequestFile = ({ requestFilePath }: Props) => {
  const [showRequestTabs, setShowRequestTabs] = useState(true);
  const requestFileContentQuery = useGetFileQuery(requestFilePath);

  if (requestFileContentQuery.isPending) {
    return <Loader />;
  }

  if (requestFileContentQuery.isError) {
    return <RequestFileLoadError error={requestFileContentQuery.error} />;
  }

  return (
    <Stack data-testid="active-request-file">
      <Card data-testid="request-body-template" p="xs">
        <EditableRequest
          requestFilePath={requestFilePath}
          onEditModeChange={(isEditing) => setShowRequestTabs(!isEditing)}
        />
      </Card>

      {showRequestTabs && (
        <Tabs defaultValue="run">
          <Tabs.List>
            <Tabs.Tab value="run">Run</Tabs.Tab>
            <Tabs.Tab value="history">History</Tabs.Tab>
            <Tabs.Tab value="file">File</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="run" p="md" aria-level={2}>
            <RunRequestForm requestFilePath={requestFilePath} />
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
      )}
    </Stack>
  );
};
