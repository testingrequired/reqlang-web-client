import { getEnvsFromRunHistory } from "@/services/history";
import { Select } from "@mantine/core";
import { getRouteApi } from "@tanstack/react-router";
import { RequestRun } from "server-types";

const routeApi = getRouteApi("/history");

type Props = {
  history: RequestRun[];
};

export const EnvFilter = ({ history }: Props) => {
  const nav = routeApi.useNavigate();
  const search = routeApi.useSearch();

  return (
    <Select
      placeholder="Select an environment"
      value={search.env ?? null}
      onChange={(value) =>
        nav({
          search: (prev) => ({
            ...prev,
            env: value ?? undefined,
          }),
        })
      }
      data={getEnvsFromRunHistory(history)}
    />
  );
};
