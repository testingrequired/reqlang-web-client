import {
  Alert,
  Button,
  ButtonGroup,
  Card,
  Loader,
  Stack,
  Switch,
  Tabs,
  Text,
  TextInput,
} from "@mantine/core";
import { FC, useEffect, useState } from "react";
import { useParsedDraftFileQuery } from "@/queries/parse";
import { RequestFilParseError } from "./RequestFileParseError";
import { useStore } from "zustand";
import {
  DFAULT_REQUEST,
  DFAULT_RESPONSE,
  useRequestFilesStore,
} from "@/stores/requestFiles";
import { RunDraftForm } from "./RunDraftForm";
import { notifications } from "@mantine/notifications";
import { CopyCode } from "@/components/common/CopyCode";
import { getRequestFromRequestFile } from "@/services/requestFile";
import { HttpRequest, HttpResponse, ParseResult } from "reqlang-types";
import { useCounter } from "@mantine/hooks";
import {
  IconArrowBackUp,
  IconCheck,
  IconDeviceFloppy,
  IconFileDownload,
} from "@tabler/icons-react";
import { modals } from "@mantine/modals";
import { FILES_KEYS, useSaveToFileMutation } from "@/queries/files";
import { useQueryClient } from "@tanstack/react-query";
import { EditHttpRequestForm } from "./EditHttpRequestForm";
import { EditHttpResponseForm } from "./EditHttpResponseForm";
import { EditConfigForm } from "./EditConfigForm";

type Props = {
  path: string;
};

export const ActiveDraftFile = (props: Props) => {
  const [runTabKey, runTabKeyHandlers] = useCounter(0);
  const openRequestFilesStore = useStore(useRequestFilesStore);
  const [editContent, setEditContent] = useState<string>("");

  const draftFileContent = openRequestFilesStore.getDraftFileContent(
    props.path,
  );

  const [draftRequest, setDraftRequest] = useState<HttpRequest>(
    draftFileContent?.request ?? DFAULT_REQUEST,
  );

  const [draftConfig, setDraftConfig] = useState<string>("");

  const [draftResponse, setDraftResponse] = useState<HttpResponse | null>(
    DFAULT_RESPONSE,
  );

  const [usingResponse, setUsingResponse] = useState(false);

  useEffect(() => {
    if (!usingResponse) {
      setDraftResponse(null);
    } else {
      setDraftResponse(DFAULT_RESPONSE);
    }
  }, [usingResponse]);

  useEffect(() => {
    const blockEnd = "```";

    const requestBlockStart = "```%request";

    const requestFirstLine = `${draftRequest?.verb} ${draftRequest?.target} HTTP/${draftRequest?.http_version}`;
    const requestHeaderLines = draftRequest?.headers.length
      ? draftRequest?.headers
          .map(([key, value]) => `${key}: ${value}`)
          .join("\n") + "\n"
      : "";
    const requestBody = draftRequest?.body?.length
      ? "\n" + draftRequest.body
      : "";

    const requestHeadersAndBody =
      requestHeaderLines && requestBody
        ? requestHeaderLines + requestBody
        : "\n";

    const requestBlock = `${requestBlockStart}\n${requestFirstLine}\n${requestHeadersAndBody}\n${blockEnd}`;

    //
    const responseBlockStart = "```%response";

    const responseFirstLine = `HTTP/${draftResponse?.http_version} ${draftResponse?.status_code} ${draftResponse?.status_text}`;
    const responseHeaderLines = draftResponse?.headers.length
      ? draftResponse.headers
          .map(([key, value]) => `${key}: ${value}`)
          .join("\n") + "\n"
      : "";
    const responseBody = draftResponse?.body?.length
      ? "\n" + draftResponse.body
      : "";

    let responseHeadersAndBody: string;

    if (responseHeaderLines.length) {
      if (responseBody.length) {
        responseHeadersAndBody = responseHeaderLines + responseBody;
      } else {
        responseHeadersAndBody = responseHeaderLines + "\n";
      }
    } else if (responseBody.length) {
      responseHeadersAndBody = responseBody + "\n";
    } else {
      responseHeadersAndBody = "\n";
    }

    const responseBlock = `${responseBlockStart}\n${responseFirstLine}\n${responseHeadersAndBody}\n${blockEnd}`;

    const configBlockStart = "```%config";
    const configBlock = `${configBlockStart}\n${draftConfig}\n${blockEnd}\n`;

    setEditContent(
      requestBlock + "\n\n" + responseBlock + "\n\n" + configBlock,
    );
  }, [draftRequest, draftResponse]);

  const hasPendingChanges =
    JSON.stringify(draftRequest) !==
      JSON.stringify(draftFileContent?.request) ||
    JSON.stringify(draftResponse) !==
      JSON.stringify(draftFileContent?.response) ||
    JSON.stringify(draftConfig) !== JSON.stringify(draftFileContent?.config);

  const handleSave = () => {
    openRequestFilesStore.saveDraftFile(props.path, {
      path: props.path,
      request: draftRequest,
      response: draftResponse,
      config: draftConfig,
    });

    runTabKeyHandlers.increment();

    notifications.show({
      title: "Draft Saved!",
      color: "green",
      message: props.path,
      icon: <IconCheck />,
    });
  };

  const handleRevert = () => {
    setDraftRequest(draftFileContent?.request ?? DFAULT_REQUEST);
    setDraftResponse(draftFileContent?.response ?? DFAULT_RESPONSE);
    setDraftConfig(draftFileContent?.config ?? "");
    setUsingResponse(!!draftFileContent?.response);

    notifications.show({
      title: "Changes Reverted",
      message: props.path,
    });
  };

  const handleSaveToFile = () => {
    modals.open({
      title: "Save To File",
      children: (
        <SaveToFileModal
          draftFileName={props.path}
          fileContentToSave={editContent}
        />
      ),
    });
  };

  return (
    <Stack data-testid="active-draft-file">
      <ButtonGroup>
        <Button
          leftSection={<IconDeviceFloppy stroke={1} />}
          color="gray"
          variant="filled"
          size="compact-sm"
          onClick={handleSave}
          disabled={!hasPendingChanges}
        >
          Save Draft
        </Button>
        <Button
          leftSection={<IconArrowBackUp stroke={1} />}
          color="gray"
          variant="filled"
          size="compact-sm"
          onClick={handleRevert}
          disabled={!hasPendingChanges}
        >
          Revert
        </Button>
        <Button
          leftSection={<IconFileDownload stroke={1} />}
          color="gray"
          variant="filled"
          size="compact-sm"
          onClick={handleSaveToFile}
          disabled={hasPendingChanges}
        >
          Save To File
        </Button>
      </ButtonGroup>

      <Tabs defaultValue="edit" data-testid="active-draft-file-tabs">
        <Tabs.List>
          <Tabs.Tab
            value="edit"
            style={{
              fontStyle:
                draftRequest !== draftFileContent?.request
                  ? "italic"
                  : "inherit",
            }}
          >
            Edit
          </Tabs.Tab>
          <Tabs.Tab value="run" disabled={hasPendingChanges}>
            Run
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="edit" data-testid="active-draft-file-edit-tab">
          <Stack gap="lg">
            <EditHttpRequestForm
              value={draftRequest}
              onChange={setDraftRequest}
            />

            <EditConfigForm
              value={{
                config: draftConfig,
              }}
              onChange={(v) => {
                setDraftConfig(v.config);
              }}
            />

            {usingResponse && draftResponse ? (
              <>
                <Switch
                  label="Enable Response Assertion"
                  checked={usingResponse}
                  onChange={(event) => setUsingResponse(event.target.checked)}
                />
                <EditHttpResponseForm
                  value={draftResponse}
                  onChange={setDraftResponse}
                />
              </>
            ) : (
              <Alert title="Response Assertion">
                <Text size="sm">You can define an expected HTTP Response.</Text>

                <Switch
                  label="Enable Response Assertion"
                  checked={usingResponse}
                  onChange={(event) => setUsingResponse(event.target.checked)}
                />
              </Alert>
            )}
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel
          value="run"
          key={runTabKey}
          data-testid="active-draft-file-run-tab"
        >
          <RunPanel path={props.path} content={editContent} />
        </Tabs.Panel>
      </Tabs>
    </Stack>
  );
};

type RunPanelProps = {
  path: string;
  content: string;
};

const RunPanel: FC<RunPanelProps> = ({ path, content }) => {
  const parsedRequestFileQuery = useParsedDraftFileQuery(path, content);

  if (parsedRequestFileQuery.isError) {
    return <RequestFilParseError error={parsedRequestFileQuery.error} />;
  }

  if (parsedRequestFileQuery.isPending) {
    return <Loader />;
  }

  const requestText = getRequestFromRequestFile(
    parsedRequestFileQuery.data as ParseResult,
    content,
  );

  return (
    <Stack>
      <Card data-testid="draft-body-template" p="xs">
        <CopyCode text={requestText}>{requestText}</CopyCode>
      </Card>
      <RunDraftForm path={path} content={content} />
    </Stack>
  );
};

type SaveToFileModalProps = {
  draftFileName: string;
  fileContentToSave: string;
};

const SaveToFileModal: FC<SaveToFileModalProps> = ({
  draftFileName,
  fileContentToSave,
}) => {
  const [fileName, setFileName] = useState<string>("");
  const mutation = useSaveToFileMutation();
  const openRequestFilesStore = useStore(useRequestFilesStore);
  const queryClient = useQueryClient();

  const handleSave = () => {
    mutation.mutate(
      {
        file_content: fileContentToSave,
        file_path: fileName,
      },
      {
        onSuccess() {
          openRequestFilesStore.openFile(fileName);
          openRequestFilesStore.closeFile(draftFileName);

          queryClient.invalidateQueries({
            queryKey: FILES_KEYS.all,
          });

          notifications.show({
            color: "green",
            icon: <IconCheck />,
            title: "Draft Saved To File",
            message: `Saved as "${fileName}"`,
          });

          modals.closeAll();
        },
      },
    );
  };

  return (
    <>
      <TextInput
        label="Path to save to"
        placeholder="path/to/save/request.reqlang"
        data-autofocus
        value={fileName}
        onChange={(e) => setFileName(e.target.value)}
      />
      <Button fullWidth onClick={handleSave} mt="md">
        Save
      </Button>
    </>
  );
};
