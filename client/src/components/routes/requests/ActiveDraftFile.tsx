import {
  Button,
  ButtonGroup,
  Card,
  Loader,
  Stack,
  Tabs,
  Textarea,
} from "@mantine/core";
import { FC, useState } from "react";
import { useParsedDraftFileQuery } from "@/queries/parse";
import { RequestFilParseError } from "./RequestFileParseError";
import { useStore } from "zustand";
import { useRequestFilesStore } from "@/stores/requestFiles";
import { RunDraftForm } from "./RunDraftForm";
import { notifications } from "@mantine/notifications";
import { CopyCode } from "@/components/common/CopyCode";
import { getRequestFromRequestFile } from "@/services/requestFile";
import { ParseResult } from "reqlang-types";
import { useCounter } from "@mantine/hooks";
import { IconCheck } from "@tabler/icons-react";

type Props = {
  path: string;
};

export const ActiveDraftFile = (props: Props) => {
  const [runTabKey, runTabKeyHandlers] = useCounter(0);
  const openRequestFilesStore = useStore(useRequestFilesStore);

  const draftFileContent = openRequestFilesStore.getDraftFileContent(
    props.path,
  );

  const [editContent, setEditContent] = useState<string>(draftFileContent);

  const parsedRequestFileQuery = useParsedDraftFileQuery(
    props.path,
    draftFileContent,
  );

  if (parsedRequestFileQuery.isPending) {
    return <Loader />;
  }

  const handleChangeEditContent = (
    e: React.ChangeEvent<HTMLTextAreaElement>,
  ) => {
    setEditContent(e.target.value);
  };

  const handleSave = () => {
    openRequestFilesStore.saveDraftFile(props.path, editContent);

    runTabKeyHandlers.increment();

    notifications.show({
      title: "Draft Saved!",
      color: "green",
      message: props.path,
      icon: <IconCheck />,
    });
  };

  const handleRevert = () => {
    setEditContent(draftFileContent);

    notifications.show({
      title: "Changes Reverted",
      message: props.path,
    });
  };

  return (
    <Stack data-testid="active-draft-file">
      <ButtonGroup>
        <Button
          size="compact-sm"
          variant="light"
          onClick={handleSave}
          disabled={editContent === draftFileContent}
        >
          Save Draft
        </Button>
        <Button
          color="red"
          variant="light"
          size="compact-sm"
          onClick={handleRevert}
          disabled={editContent === draftFileContent}
        >
          Revert
        </Button>
      </ButtonGroup>

      <Tabs defaultValue="edit" data-testid="active-draft-file-tabs">
        <Tabs.List>
          <Tabs.Tab
            value="edit"
            style={{
              fontStyle:
                editContent !== draftFileContent ? "italic" : "inherit",
            }}
          >
            Edit
          </Tabs.Tab>
          <Tabs.Tab value="run" disabled={editContent !== draftFileContent}>
            Run
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="edit" data-testid="active-draft-file-edit-tab">
          <Textarea
            value={editContent}
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

          {parsedRequestFileQuery.isError && (
            <RequestFilParseError error={parsedRequestFileQuery.error} />
          )}
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
