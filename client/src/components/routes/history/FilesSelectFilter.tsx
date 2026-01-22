import { FilesSelect } from "@/components/common/FileSelect";
import { getRouteApi } from "@tanstack/react-router";

const routeApi = getRouteApi("/history");

export const FilesSelectFilter = () => {
  const nav = routeApi.useNavigate();
  const search = routeApi.useSearch();

  const selectedRequestFilePath = search.requestFilePath ?? null;
  const selectedRequestRunInHistory = search.runId ?? null;

  return (
    <FilesSelect
      onChange={(value) =>
        nav({
          search: (prev) => ({
            ...prev,
            requestFilePath: value ?? undefined,
          }),
        })
      }
      value={selectedRequestFilePath}
      clearable
      disabled={
        selectedRequestFilePath === null && selectedRequestRunInHistory !== null
      }
    />
  );
};
