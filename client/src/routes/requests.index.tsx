import { createFileRoute } from "@tanstack/react-router";
import { RequestsRoute } from "@/components/routes/requests/RequestsRoute";

export const Route = createFileRoute("/requests/")({
  component: RequestsRoute,
});
