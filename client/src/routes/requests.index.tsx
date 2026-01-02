import { OpenedRequestFilesForm } from "@/components/routes/requests/OpenedRequestFilesForm";
import { OpenRequestFilesTabs } from "@/components/routes/requests/OpenRequestFilesTabs";
import { Stack } from "@mantine/core";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/requests/")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <Stack data-testid="requests-view">
      <OpenedRequestFilesForm />

      <OpenRequestFilesTabs />
    </Stack>
  );
}
