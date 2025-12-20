import { CopyCode } from "@/components/CopyCode";
import { MultiFilesSelect } from "@/components/MultiFileSelect";
import { RequestFromRequestFile } from "@/components/RequestFromRequestFile";
import { RequestRunHistory } from "@/components/RequestRunHistory";
import { RunRequestForm } from "@/components/RunRequestForm";
import { useGetFileQuery } from "@/queries/files";
import { useParsedRequestFileMutation } from "@/queries/parse";
import {
  ActionIcon,
  Alert,
  Button,
  ButtonGroup,
  Card,
  Loader,
  Stack,
  Tabs,
  Tooltip,
} from "@mantine/core";
import { IconFolderOpen, IconRefresh } from "@tabler/icons-react";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ParseResult } from "reqlang-types";

export const Route = createFileRoute("/requests/")({
  component: RouteComponent,
});

function RouteComponent() {
  const [selectedFiles, setSelectFiles] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<string | null>(null);

  useEffect(() => {
    if (activeTab === null && selectedFiles.length > 0) {
      setActiveTab(selectedFiles.at(0) as unknown as string);
    }

    if (activeTab !== null) {
      if (selectedFiles.length === 0) {
        setActiveTab(null);
      }
    }
  }, [selectedFiles, activeTab]);

  return (
    <Stack>
      <RequestFileSelectForm value={selectedFiles} onChange={setSelectFiles} />

      {selectedFiles.length > 0 && (
        <Tabs value={activeTab} onChange={setActiveTab}>
          <Tabs.List>
            {selectedFiles.map((selectedFile) => (
              <Tabs.Tab value={selectedFile}>{selectedFile}</Tabs.Tab>
            ))}
          </Tabs.List>

          {selectedFiles.map((selectedFile) => (
            <Tabs.Panel value={selectedFile}>
              <Stack>
                <DisplayRequestFileForRun requestFilePath={selectedFile} />
              </Stack>
            </Tabs.Panel>
          ))}
        </Tabs>
      )}
    </Stack>
  );
}

type Props = {
  value: string[];
  onChange: (value: string[]) => void;
};

const RequestFileSelectForm = ({ value, onChange }: Props) => {
  const [showOpenFiles, setShowOpenFiles] = useState(false);
  const [selectedFiles, setSelectFiles] = useState<string[]>(value);

  const save = () => {
    onChange(selectedFiles);
    setShowOpenFiles(false);
  };

  const cancel = () => {
    setSelectFiles(value);
    setShowOpenFiles(false);
  };

  const changeHaveBeenMade =
    JSON.stringify(value) !== JSON.stringify(selectedFiles);

  return showOpenFiles ? (
    <>
      <MultiFilesSelect
        onChange={setSelectFiles}
        value={selectedFiles}
        clearable
      />

      <ButtonGroup>
        <Button onClick={save} disabled={!changeHaveBeenMade}>
          Save
        </Button>
        <Button onClick={cancel} color="red">
          Cancel
        </Button>
      </ButtonGroup>
    </>
  ) : (
    <ButtonGroup>
      <ActionIcon
        size="input-xl"
        variant="light"
        onClick={() => {
          setShowOpenFiles(true);
        }}
        aria-label="Open/Close Request Files"
      >
        <IconFolderOpen stroke={1.0} />
      </ActionIcon>
    </ButtonGroup>
  );
};

type DisplayRequestFileForRunProps = {
  requestFilePath: string;
};

const DisplayRequestFileForRun = ({
  requestFilePath,
}: DisplayRequestFileForRunProps) => {
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
    <Stack>
      <Card>
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

            <Tabs.Panel value="run" p="md">
              <RunRequestForm
                result={parseResult}
                requestFilePath={requestFilePath}
                requestFileText={requestFileContent}
              />
            </Tabs.Panel>

            <Tabs.Panel value="history" p="md">
              <RequestRunHistory requestFilePath={requestFilePath} />
            </Tabs.Panel>

            <Tabs.Panel value="file" p="md">
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
