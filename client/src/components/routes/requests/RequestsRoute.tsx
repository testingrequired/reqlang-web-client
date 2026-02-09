import { Alert, Stack, Text, ThemeIcon } from "@mantine/core";
import { RequestFilesForm } from "@/components/routes/requests/RequestFilesForm";
import { OpenRequestFiles } from "@/components/routes/requests/OpenRequestFiles";
import { useStore } from "zustand";
import { useRequestFilesStore } from "@/stores/requestFiles";
import { IconArrowUp } from "@tabler/icons-react";

export const RequestsRoute = () => {
  const openRequestFilesStore = useStore(useRequestFilesStore);

  const noFilesOpen =
    openRequestFilesStore.openedFiles.length === 0 &&
    openRequestFilesStore.draftFiles.length === 0;

  return (
    <Stack data-testid="requests-view">
      {noFilesOpen ? (
        <>
          <RequestFilesForm />
          <Alert
            p="xs"
            title="No files are open"
            variant="transparent"
            color="gray"
            icon={
              <ThemeIcon size="sm" variant="transparent" color="gray">
                <IconArrowUp />
              </ThemeIcon>
            }
          >
            <Text size="sm">
              Click this button open a request or the other button to create a
              new request.
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
