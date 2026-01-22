import { RequestRunSelect } from "@/components/common/RequestRunSelect";
import { RequestRun } from "server-types";
import { routeApi } from "@/components/routes/history/HistoryRoute";

type Props = {
  history: RequestRun[];
};

export const RequestRunSelectFilter = ({ history }: Props) => {
  const nav = routeApi.useNavigate();
  const search = routeApi.useSearch();

  const selectedRequestFilePath = search.requestFilePath ?? null;
  const selectedRequestRunInHistory = search.runId ?? null;

  return (
    <RequestRunSelect
      value={selectedRequestRunInHistory}
      onChange={(value) =>
        nav({
          search: (prev) => ({
            ...prev,
            runId: value ?? undefined,
          }),
        })
      }
      requestRunHistory={history}
      showPathsInSelect={selectedRequestFilePath === null}
    />
  );
};
