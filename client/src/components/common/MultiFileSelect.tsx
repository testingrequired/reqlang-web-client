import { useGetFilesQuery } from "@/queries/files";
import { ActionIcon, Alert, Loader, MultiSelect, Tooltip } from "@mantine/core";
import { getHotkeyHandler } from "@mantine/hooks";
import { IconRefresh } from "@tabler/icons-react";

type Prop = {
  onChange: (value: string[]) => void;
  onBlur: () => void;
  value: string[];
  clearable?: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
};

export const MultiFilesSelect = ({
  onChange,
  onBlur,
  value,
  clearable = false,
  disabled = false,
  autoFocus = false,
}: Prop) => {
  const filesQuery = useGetFilesQuery();

  function refresh() {
    filesQuery.refetch();
  }

  if (filesQuery.isError) {
    return <Alert color="red">There was an issue fetching files list</Alert>;
  }

  if (filesQuery.isPending) {
    return <Loader />;
  }

  const icon = (
    <Tooltip label="Reload File List">
      <ActionIcon
        variant="filled"
        aria-label="Refresh File List"
        onClick={refresh}
        disabled={disabled}
      >
        <IconRefresh stroke={1.5} />
      </ActionIcon>
    </Tooltip>
  );

  return (
    <MultiSelect
      name="multifile-select"
      placeholder="Select a request file"
      data={filesQuery.data}
      onChange={onChange}
      value={value}
      leftSection={icon}
      hidePickedOptions
      searchable
      clearable={clearable}
      disabled={disabled}
      autoFocus={autoFocus}
      onBlur={onBlur}
      comboboxProps={{
        withinPortal: false,
      }}
      onKeyDown={getHotkeyHandler([
        ["Escape", onBlur],
        ["mod+Enter", onBlur],
      ])}
    />
  );
};
