import {
  Alert,
  Button,
  ButtonGroup,
  Card,
  HoverCard,
  Loader,
  Stack,
  Tabs,
  Text,
  TextInput,
  ThemeIcon,
  Tooltip,
} from "@mantine/core";
import { FC, useEffect, useState } from "react";
import { useParsedDraftFileQuery } from "@/queries/parse";
import { RequestFilParseError } from "./RequestFileParseError";
import { useStore } from "zustand";
import {
  DEFAULT_CONFIG,
  DFAULT_REQUEST,
  DFAULT_RESPONSE,
  DraftFile,
  useRequestFilesStore,
} from "@/stores/requestFiles";
import { RunDraftForm } from "./RunDraftForm";
import { notifications } from "@mantine/notifications";
import { CopyCode } from "@/components/common/CopyCode";
import { getRequestFromRequestFile } from "@/services/requestFile";
import {
  HttpRequest,
  HttpResponse,
  ParsedConfig,
  ParseResult,
} from "reqlang-types";
import { useCounter, useDebouncedState } from "@mantine/hooks";
import {
  IconAlertCircleFilled,
  IconArrowBackUp,
  IconCheck,
  IconDeviceFloppy,
  IconExclamationCircle,
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

const RUN_PARSE_DEBOUNCE = 1000;

export const ActiveDraftFile = (props: Props) => {
  const [runTabKey, runTabKeyHandlers] = useCounter(0);
  const openRequestFilesStore = useStore(useRequestFilesStore);
  const [editContent, setEditContent] = useDebouncedState<string>(
    "",
    RUN_PARSE_DEBOUNCE,
  );
  const parseFileQuery = useParsedDraftFileQuery(props.path, editContent);

  const draftFileFromStore = openRequestFilesStore.getDraftFileContent(
    props.path,
  );

  const draftRequestFromStore = draftFileFromStore?.request;
  const draftResponseFromStore = draftFileFromStore?.response;
  const draftConfigFromStore = draftFileFromStore?.config;

  const [draftRequest, setDraftRequest] = useState<HttpRequest>(
    draftRequestFromStore ?? DFAULT_REQUEST,
  );

  const [draftConfig, setDraftConfig] = useState<ParsedConfig>(
    draftConfigFromStore ?? DEFAULT_CONFIG,
  );

  const [draftResponse, setDraftResponse] = useState<HttpResponse | null>(
    draftResponseFromStore ?? null,
  );

  const usingResponse = draftResponse !== null;

  useStringifyDraftEffect(
    {
      path: props.path,
      request: draftRequest,
      response: draftResponse,
      config: draftConfig,
    },
    setEditContent,
  );

  const hasPendingChanges =
    JSON.stringify(draftRequest) !== JSON.stringify(draftRequestFromStore) ||
    JSON.stringify(draftResponse) !==
      JSON.stringify(draftResponseFromStore ?? null) ||
    JSON.stringify(draftConfig) !== JSON.stringify(draftConfigFromStore);

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
    setDraftRequest(draftRequestFromStore ?? DFAULT_REQUEST);
    setDraftResponse(draftResponseFromStore ?? null);
    setDraftConfig(draftConfigFromStore ?? DEFAULT_CONFIG);

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
            rightSection={
              <div data-testid="parse-result-indicator">
                {parseFileQuery.isSuccess || parseFileQuery.isError ? (
                  <HoverCard closeDelay={1000}>
                    <HoverCard.Target>
                      {parseFileQuery.isError ? (
                        <ThemeIcon
                          color="red"
                          variant="subtle"
                          size="xs"
                          data-testid="parse-result-indicator-failure"
                        >
                          <IconExclamationCircle />
                        </ThemeIcon>
                      ) : (
                        <Tooltip
                          label="Draft was parsed successfully"
                          color="dark"
                          position="bottom"
                        >
                          <ThemeIcon
                            color="green"
                            variant="subtle"
                            size="xs"
                            data-testid="parse-result-indicator-success"
                          >
                            <IconCheck />
                          </ThemeIcon>
                        </Tooltip>
                      )}
                    </HoverCard.Target>
                    {parseFileQuery.isError && (
                      <HoverCard.Dropdown>
                        <RequestFilParseError error={parseFileQuery.error} />
                      </HoverCard.Dropdown>
                    )}
                  </HoverCard>
                ) : (
                  <Loader
                    size="xs"
                    data-testid="parse-result-indicator-loading"
                  />
                )}
              </div>
            }
            style={{
              fontStyle:
                draftRequest !== draftRequestFromStore ? "italic" : "inherit",
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

            <EditConfigForm value={draftConfig} onChange={setDraftConfig} />

            {usingResponse ? (
              <>
                <Button.Group>
                  <Button
                    color="red"
                    variant="light"
                    onClick={() => {
                      if (draftResponse) {
                        setDraftResponse(null);
                      } else {
                        setDraftResponse(
                          draftResponseFromStore ?? DFAULT_RESPONSE,
                        );
                      }
                    }}
                  >
                    Remove Response Assertion
                  </Button>
                </Button.Group>

                <EditHttpResponseForm
                  value={draftResponse}
                  onChange={setDraftResponse}
                />
              </>
            ) : (
              <Alert title="Response Assertion" variant="transparent">
                <Text size="sm">
                  You can define an expected HTTP Response as a test.
                </Text>

                <Button
                  onClick={() => {
                    if (draftResponse) {
                      setDraftResponse(null);
                    } else {
                      setDraftResponse(
                        draftResponseFromStore ?? DFAULT_RESPONSE,
                      );
                    }
                  }}
                >
                  Add Response Assertion
                </Button>
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

const useStringifyDraftEffect = (
  draftFile: DraftFile,
  setResult: (result: string) => void,
) => {
  const {
    request: draftRequest,
    response: draftResponse,
    config: draftConfig,
  } = draftFile;
  return useEffect(() => {
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

    let requestHeadersAndBody: string = "\n";

    if (requestHeaderLines && requestBody) {
      requestHeadersAndBody = `${requestHeaderLines}${requestBody}`;
    } else if (requestHeaderLines) {
      requestHeadersAndBody = requestHeaderLines;
    } else if (requestBody) {
      requestHeadersAndBody = requestBody;
    }

    const requestBlock = `${requestBlockStart}\n${requestFirstLine}\n${requestHeadersAndBody}\n${blockEnd}`;

    //
    const responseBlockStart = "```%response";
    let responseBlock: string = "";

    if (draftResponse) {
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

      responseBlock = `${responseBlockStart}\n${responseFirstLine}\n${responseHeadersAndBody}\n${blockEnd}`;
    }

    const configBlockStart = "```%config";
    const secrets =
      draftConfig.secrets === null
        ? "secrets = []\n"
        : `secrets = [${draftConfig.secrets.map((secret) => `"${secret}"`).join(", ")}]\n\n`;

    const prompts =
      draftConfig.prompts === null
        ? ""
        : `${draftConfig.prompts.map((prompt) => `[[prompts]]\nname = "${prompt.name}"\ndefault = "${prompt.default === null ? "" : prompt.default}"`).join("\n\n")}\n\n`;

    const vars =
      draftConfig.vars === null
        ? ""
        : draftConfig.vars
            .map((v) =>
              v.default === null || v.default.length === 0
                ? `[[vars]]\nname = "${v.name}"`
                : `[[vars]]\nname = "${v.name}"\ndefault = "${v.default}\n\n"`,
            )
            .join("\n");
    const envs =
      draftConfig.envs === null
        ? ""
        : Object.entries(draftConfig.envs)
            .map(([envName, envVars]) => {
              const vars = Object.entries(envVars ?? {})
                .map((v) => `${v[0]} = "${v[1]}"`)
                .join("\n");
              return `[envs.${envName}]\n${vars}\n\n`;
            })
            .join("\n\n");
    const configBlock = `${configBlockStart}\n${secrets}${prompts}\n${vars}\n\n${envs}\n${blockEnd}\n`;

    setResult(configBlock + "\n" + requestBlock + "\n" + responseBlock + "\n");
  }, [draftRequest, draftResponse, draftConfig]);
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
        onError(error) {
          console.log(JSON.stringify(error.cause));
          notifications.show({
            color: "red",
            icon: <IconAlertCircleFilled />,
            title: "Error Saving Draft",
            message: `Error saving file: ${error}`,
          });
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
