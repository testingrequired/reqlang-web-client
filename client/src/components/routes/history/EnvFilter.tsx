import { getEnvsFromRunHistory } from "@/services/history";
import { Select } from "@mantine/core";
import { RequestRun } from "server-types";
import { routeApi } from "@/components/routes/history/HistoryRoute";

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
