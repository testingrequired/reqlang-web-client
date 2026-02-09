import { MultiFilesSelect } from "@/components/common/MultiFileSelect";
import { useRequestFilesStore } from "@/stores/requestFiles";
import {
  ActionIcon,
  ButtonGroup,
  Indicator,
  TooltipFloating,
} from "@mantine/core";
import {
  IconFileText,
  IconFileTextFilled,
  IconFileXFilled,
  IconPlus,
} from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { useStore } from "zustand";
import { useHotkeys } from "@mantine/hooks";

/**
 * A two button form to select/deselect which request files are "open"
 */
export const RequestFilesForm = () => {
  const openRequestFilesStore = useStore(useRequestFilesStore);
  const [showMultiFileSelect, setShowMultiFileSelect] = useState(false);
  const [newSelectedFiles, setNewSelectedFiles] = useState<string[]>([]);

  useHotkeys([["mod+O", () => setShowMultiFileSelect(true)]]);

  useEffect(() => {
    setNewSelectedFiles(openRequestFilesStore.openedFiles);
  }, [openRequestFilesStore.openedFiles]);

  const save = () => {
    openRequestFilesStore.openFiles(newSelectedFiles);
    setShowMultiFileSelect(false);
  };

  const cancel = () => {
    setNewSelectedFiles(openRequestFilesStore.openedFiles);
    setShowMultiFileSelect(false);
  };

  const newDraftFile = () => {
    openRequestFilesStore.newDraftFile();
  };

  const clear = () => {
    openRequestFilesStore.closeAllFiles();
  };

  if (showMultiFileSelect) {
    return (
      <MultiFilesSelect
        onChange={setNewSelectedFiles}
        onCancel={cancel}
        value={newSelectedFiles}
        clearable
        autoFocus
        onBlur={save}
      />
    );
  }

  return (
    <ButtonGroup>
      <TooltipFloating
        label="Open/Close Request Files"
        position="bottom"
        color="dark"
      >
        <ActionIcon
          size="input-sm"
          variant="subtle"
          color="gray"
          onClick={() => {
            setShowMultiFileSelect(true);
          }}
          aria-label="Open/Close Request Files"
          radius="xs"
        >
          <Indicator
            offset={5}
            radius="xl"
            position="bottom-end"
            label={
              newSelectedFiles.length + openRequestFilesStore.draftFiles.length
            }
            disabled={
              newSelectedFiles.length === 0 &&
              openRequestFilesStore.draftFiles.length === 0
            }
          >
            {newSelectedFiles.length === 0 &&
            openRequestFilesStore.draftFiles.length === 0 ? (
              <IconFileText stroke={1.25} />
            ) : (
              <IconFileTextFilled stroke={1.25} />
            )}
          </Indicator>
        </ActionIcon>
      </TooltipFloating>

      {(openRequestFilesStore.openedFiles.length > 0 ||
        openRequestFilesStore.draftFiles.length > 0) && (
        <TooltipFloating
          label="Close All Request Files"
          position="bottom"
          color="dark"
        >
          <ActionIcon
            size="input-sm"
            variant="light"
            color="red"
            onClick={clear}
            aria-label="Close All Request Files"
            radius="xs"
          >
            <IconFileXFilled stroke={1.25} />
          </ActionIcon>
        </TooltipFloating>
      )}

      <TooltipFloating label="Create New File" position="bottom" color="dark">
        <ActionIcon
          size="input-sm"
          variant="light"
          onClick={newDraftFile}
          aria-label="Create New File"
          radius="xs"
        >
          <IconPlus stroke={3} />
        </ActionIcon>
      </TooltipFloating>
    </ButtonGroup>
  );
};
