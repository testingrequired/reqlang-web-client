import { Alert, Kbd, Stack, Text, ThemeIcon } from "@mantine/core";
import { RequestFilesForm } from "@/components/routes/requests/RequestFilesForm";
import { OpenRequestFiles } from "@/components/routes/requests/OpenRequestFiles";
import { useStore } from "zustand";
import { useRequestFilesStore } from "@/stores/requestFiles";
import { useOs } from "@mantine/hooks";
import { IconArrowUp } from "@tabler/icons-react";

export const RequestsRoute = () => {
  const openRequestFilesStore = useStore(useRequestFilesStore);
  const os = useOs();

  const noFilesOpen = openRequestFilesStore.openedFiles.length === 0;

  const modifier = os === "macos" ? "⌘" : "Ctrl";

  return (
    <Stack data-testid="requests-view">
      {noFilesOpen ? (
        <>
          <RequestFilesForm />
          <Alert
            p="xs"
            title="No files are open"
            variant="light"
            color="gray"
            icon={
              <ThemeIcon size="sm" variant="transparent" color="gray">
                <IconArrowUp />
              </ThemeIcon>
            }
          >
            <Text size="sm">
              Click this button or use <Kbd>{modifier}</Kbd> + <Kbd>O</Kbd> to
              to open files.
            </Text>
          </Alert>
        </>
      ) : (
        <RequestFilesForm />
      )}
      <OpenRequestFiles />
    </Stack>
  );
};
