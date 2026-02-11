import { useRequestFilesStore } from "@/stores/requestFiles";
import { CloseButton, Group, Space, Tabs, Text } from "@mantine/core";
import { useStore } from "zustand";
import { ActiveRequestFile } from "@/components/routes/requests/ActiveRequestFile";
import { ActiveDraftFile } from "./ActiveDraftFile";
import { modals } from "@mantine/modals";

/**
 * A tabs component where each open request file is a table
 */
export const OpenRequestFiles = () => {
  const openRequestFilesStore = useStore(useRequestFilesStore);

  if (
    openRequestFilesStore.openedFiles.length === 0 &&
    openRequestFilesStore.draftFiles.length === 0
  ) {
    return null;
  }

  const tabs: string[] = [];

  return (
    <Tabs
      value={openRequestFilesStore.activeFile}
      onChange={openRequestFilesStore.setActiveFile}
      data-testid="open-request-file-tabs"
    >
      <Tabs.List>
        {openRequestFilesStore.draftFiles.map((draftFile) => {
          return (
            <Tabs.Tab
              value={draftFile.path}
              fw={
                openRequestFilesStore.activeFile === draftFile.path
                  ? "bold"
                  : "normal"
              }
              aria-label={draftFile.path}
            >
              <Group gap="xs">
                <Text mb={0} size="sm">
                  {draftFile.path}
                </Text>

                <CloseButton
                  size="sm"
                  onClick={() => {
                    modals.openConfirmModal({
                      children:
                        "Are you sure you want to close this draft? It will be lost.",
                      onConfirm() {
                        openRequestFilesStore.closeFile(draftFile.path);
                      },
                      labels: {
                        confirm: "Discard Draft",
                        cancel: "Keep Draft",
                      },
                      confirmProps: {
                        color: "red",
                      },
                    });
                  }}
                  aria-label={`Close ${draftFile.path}`}
                />
              </Group>
            </Tabs.Tab>
          );
        })}
        {openRequestFilesStore.openedFiles.map((openRequestFile) => {
          const selectedFileParts = openRequestFile.split("/");

          let j = 0;

          let label: string;

          while (true) {
            label = selectedFileParts.slice(-1 + j * -1).join("/");

            if (!tabs.includes(label)) {
              tabs.push(label);
              break;
            }

            j++;

            if (j === selectedFileParts.length) {
              break;
            }
          }

          return (
            <Tabs.Tab
              value={openRequestFile}
              fw={
                openRequestFilesStore.activeFile === openRequestFile
                  ? "bold"
                  : "normal"
              }
              aria-label={openRequestFile}
            >
              <Group gap="xs">
                <Text mb={0} size="sm">
                  {label}
                </Text>

                <CloseButton
                  size="sm"
                  onClick={() => {
                    openRequestFilesStore.closeFile(openRequestFile);
                  }}
                  aria-label={`Close ${label}`}
                />
              </Group>
            </Tabs.Tab>
          );
        })}
      </Tabs.List>

      {openRequestFilesStore.draftFiles.map((draftFile) => (
        <Tabs.Panel
          value={draftFile.path}
          key={draftFile.path}
          data-testid="active-tab-panel"
        >
          <Space h="md" />
          <ActiveDraftFile path={draftFile.path} />
        </Tabs.Panel>
      ))}

      {openRequestFilesStore.openedFiles.map((selectedFile) => (
        <Tabs.Panel
          value={selectedFile}
          key={selectedFile}
          data-testid="active-tab-panel"
        >
          <ActiveRequestFile requestFilePath={selectedFile} />
        </Tabs.Panel>
      ))}
    </Tabs>
  );
};
