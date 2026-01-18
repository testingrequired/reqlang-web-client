import { useOpenRequestFilesStore } from "@/stores/selectedRequestFile";
import { CloseButton, Group, Tabs, Text } from "@mantine/core";
import { useStore } from "zustand";
import { ActiveRequestFile } from "@/components/routes/requests/ActiveRequestFile";

/**
 * A tabs component where each open request file is a table
 */
export const OpenRequestFiles = () => {
  const openRequestFilesStore = useStore(useOpenRequestFilesStore);

  if (openRequestFilesStore.openRequestFiles.length === 0) {
    return null;
  }

  const tabs: string[] = [];

  return (
    <Tabs
      value={openRequestFilesStore.selectedRequestFile}
      onChange={openRequestFilesStore.setSelectedRequestFile}
      data-testid="open-request-file-tabs"
    >
      <Tabs.List>
        {openRequestFilesStore.openRequestFiles.map((openRequestFile) => {
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
                openRequestFilesStore.selectedRequestFile === openRequestFile
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
                    openRequestFilesStore.closeRequestfile(openRequestFile);
                  }}
                  aria-label={`Close ${label}`}
                />
              </Group>
            </Tabs.Tab>
          );
        })}
      </Tabs.List>

      {openRequestFilesStore.openRequestFiles.map((selectedFile) => (
        <Tabs.Panel
          value={selectedFile}
          key={selectedFile}
          data-testid="active-request-file-tab-panel"
        >
          <ActiveRequestFile requestFilePath={selectedFile} />
        </Tabs.Panel>
      ))}
    </Tabs>
  );
};
