import { MultiFilesSelect } from "@/components/MultiFileSelect";
import { useOpenRequestFilesStore } from "@/stores/selectedRequestFile";
import { ActionIcon, ButtonGroup } from "@mantine/core";
import {
  IconFileText,
  IconFileTextFilled,
  IconFileXFilled,
} from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { useStore } from "zustand";

/**
 * A two button form to select/deselect which request files are "open"
 */
export const OpenedRequestFilesForm = () => {
  const openRequestFilesStore = useStore(useOpenRequestFilesStore);
  const [showMultiFileSelect, setShowMultiFileSelect] = useState(false);
  const [newSelectedFiles, setNewSelectedFiles] = useState<string[]>([]);

  useEffect(() => {
    setNewSelectedFiles(openRequestFilesStore.openRequestFiles);
  }, [openRequestFilesStore.openRequestFiles]);

  const save = () => {
    openRequestFilesStore.setOpenRequestFiles(newSelectedFiles);
    setShowMultiFileSelect(false);
  };

  const clear = () => {
    openRequestFilesStore.setOpenRequestFiles([]);
  };

  if (showMultiFileSelect) {
    return (
      <MultiFilesSelect
        onChange={setNewSelectedFiles}
        value={newSelectedFiles}
        clearable
        autoFocus
        onBlur={save}
      />
    );
  }

  return (
    <ButtonGroup>
      <ActionIcon
        size="input-lg"
        variant="light"
        onClick={() => {
          setShowMultiFileSelect(true);
        }}
        aria-label="Open/Close Request Files"
      >
        {newSelectedFiles.length === 0 ? (
          <IconFileText stroke={1.25} />
        ) : (
          <IconFileTextFilled stroke={1.25} />
        )}
      </ActionIcon>

      {newSelectedFiles.length > 0 && (
        <ActionIcon
          size="input-lg"
          variant="light"
          color="red"
          onClick={clear}
          aria-label="Close All Request Files"
        >
          <IconFileXFilled stroke={1.25} />
        </ActionIcon>
      )}
    </ButtonGroup>
  );
};
