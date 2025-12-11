import { useGetFilesQuery } from "@/queries/parseReqlang";
import { ActionIcon, Alert, Select } from "@mantine/core";
import { IconRefresh } from "@tabler/icons-react";

type Prop = {
  onChange: (value: string | null) => void;
  value: string | null;
};

export const FilesSelect = ({ onChange, value }: Prop) => {
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
    <ActionIcon variant="filled" aria-label="Settings" onClick={refresh}>
      <IconRefresh stroke={1.5} />
    </ActionIcon>
  );

  return (
    <Select
      placeholder="Select a request file"
      data={filesQuery.data}
      onChange={onChange}
      value={value}
      leftSection={icon}
    />
  );
};
