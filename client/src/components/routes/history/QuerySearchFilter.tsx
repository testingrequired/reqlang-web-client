import { TextInput } from "@mantine/core";
import { getRouteApi } from "@tanstack/react-router";

const routeApi = getRouteApi("/history");

export const QuerySearchFilter = () => {
  const nav = routeApi.useNavigate();
  const search = routeApi.useSearch();

  const handleQueryFilter = (query: string) => {
    nav({
      to: "/history",
      replace: false,
      search: (prev) => {
        return {
          ...prev,
          query,
        };
      },
    });
  };

  return (
    <TextInput
      placeholder="Query the request file text"
      value={search.query ?? ""}
      onChange={(e) => {
        handleQueryFilter(e.target.value);
      }}
    />
  );
};
