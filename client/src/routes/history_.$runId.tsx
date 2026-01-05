import { RequestRunHistoryItemCollapsable } from "@/components/RequestRunHistoryItemCollapsable";
import { useGetRunHistoryByIdQuery } from "@/queries/history";
import { Alert, Loader } from "@mantine/core";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/history_/$runId")({
  component: RouteComponent,
});

function RouteComponent() {
  const params = Route.useParams();

  const getRunHistoryQuery = useGetRunHistoryByIdQuery(params.runId);

  if (getRunHistoryQuery.isLoading) {
    return <Loader />;
  }

  if (getRunHistoryQuery.isError) {
    return <Alert color="red">{getRunHistoryQuery.error.message}</Alert>;
  }

  return (
    <RequestRunHistoryItemCollapsable
      requestRun={getRunHistoryQuery.data!}
      disableCollapsing={true}
    />
  );
}
