import { useGetFilesQuery } from "@/queries/parseReqlang";
import { ActionIcon, Alert, Select, Tooltip } from "@mantine/core";
import { IconRefresh } from "@tabler/icons-react";

type Prop = {
  onChange: (value: string | null) => void;
  value: string | null;
  clearable?: boolean;
};

export const FilesSelect = ({ onChange, value, clearable = false }: Prop) => {
  const filesQuery = useGetFilesQuery();

  function refresh() {
    filesQuery.refetch();
  }

  if (filesQuery.isError) {
    return <Alert color="red">There was an issue fetching files list</Alert>;
  }

  if (filesQuery.isPending) {
    return <p>Loading...</p>;
  }

  const icon = (
    <Tooltip label="Reload File List">
      <ActionIcon
        variant="filled"
        aria-label="Refresh File List"
        onClick={refresh}
      >
        <IconRefresh stroke={1.5} />
      </ActionIcon>
    </Tooltip>
  );

  return (
    <Select
      placeholder="Select a request file"
      data={filesQuery.data}
      onChange={onChange}
      value={value}
      leftSection={icon}
      searchable
      clearable={clearable}
    />
  );
};
