import { MultiFilesSelect } from "@/components/common/MultiFileSelect";
import { useRequestFilesStore } from "@/stores/requestFiles";
import { ActionIcon, ButtonGroup, TooltipFloating } from "@mantine/core";
import {
  IconCirclePlusFilled,
  IconFileText,
  IconFileTextFilled,
  IconFileXFilled,
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
          variant="light"
          onClick={() => {
            setShowMultiFileSelect(true);
          }}
          aria-label="Open/Close Request Files"
        >
          {newSelectedFiles.length === 0 &&
          openRequestFilesStore.draftFiles.length === 0 ? (
            <IconFileText stroke={1.25} />
          ) : (
            <IconFileTextFilled stroke={1.25} />
          )}
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
          >
            <IconFileXFilled stroke={1.25} />
          </ActionIcon>
        </TooltipFloating>
      )}

      <TooltipFloating label="Create New File" position="bottom" color="dark">
        <ActionIcon
          size="input-sm"
          color="green"
          variant="subtle"
          onClick={newDraftFile}
          aria-label="Create New File"
        >
          <IconCirclePlusFilled stroke={1.25} />
        </ActionIcon>
      </TooltipFloating>
    </ButtonGroup>
  );
};
