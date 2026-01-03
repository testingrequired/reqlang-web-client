import { CopyCode } from "@/components/CopyCode";
import { RequestFromRequestFile } from "@/components/RequestFromRequestFile";
import { RequestRunHistory } from "@/components/RequestRunHistory";
import { RunRequestForm } from "@/components/RunRequestForm";
import { useGetFileQuery } from "@/queries/files";
import { useParsedRequestFileMutation } from "@/queries/parse";
import {
  ActionIcon,
  Alert,
  Card,
  Loader,
  Stack,
  Tabs,
  Tooltip,
} from "@mantine/core";
import { IconRefresh } from "@tabler/icons-react";
import { ParseResult } from "reqlang-types";

type OpenRequestFileProps = {
  requestFilePath: string;
};

/**
 * Displays the request file with several sub tabs
 *
 * - Run request
 * - History of request's runs
 * - Text content of the request file
 */
export const OpenRequestFile = ({ requestFilePath }: OpenRequestFileProps) => {
  const requestFileContentQuery = useGetFileQuery(requestFilePath);
  const parsedRequestFileMutation =
    useParsedRequestFileMutation(requestFilePath);

  if (requestFileContentQuery.isError || parsedRequestFileMutation.isError) {
    return <Alert color="red">Error loading or parsing request file</Alert>;
  }

  if (
    requestFileContentQuery.isPending ||
    parsedRequestFileMutation.isPending
  ) {
    return <Loader />;
  }

  const parseResult: ParseResult =
    parsedRequestFileMutation.data as ParseResult;

  const requestFileContent = requestFileContentQuery.data as string;

  return (
    <Stack data-testid="active-request-file">
      <Card data-testid="request-body-template">
        <RequestFromRequestFile
          result={parseResult}
          requestFileText={requestFileContent}
        />
      </Card>

      {typeof parseResult !== "undefined" && (
        <>
          <Tabs defaultValue="run">
            <Tabs.List>
              <Tabs.Tab value="run">Run</Tabs.Tab>
              <Tabs.Tab value="history">History</Tabs.Tab>
              <Tabs.Tab value="file">File</Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="run" p="md" aria-level={2}>
              <RunRequestForm
                parseResult={parseResult}
                requestFilePath={requestFilePath}
                requestFileText={requestFileContent}
              />
            </Tabs.Panel>

            <Tabs.Panel value="history" p="md" aria-level={2}>
              <RequestRunHistory requestFilePath={requestFilePath} />
            </Tabs.Panel>

            <Tabs.Panel value="file" p="md" aria-level={2}>
              <Card>
                <CopyCode text={requestFileContent}>
                  {requestFileContent}
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
