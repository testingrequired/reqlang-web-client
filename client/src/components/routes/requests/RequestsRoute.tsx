import { Stack } from "@mantine/core";
import { RequestFilesForm } from "@/components/routes/requests/RequestFilesForm";
import { OpenRequestFiles } from "@/components/routes/requests/OpenRequestFiles";

export const RequestsRoute = () => (
  <Stack data-testid="requests-view">
    <RequestFilesForm />
    <OpenRequestFiles />
  </Stack>
);
