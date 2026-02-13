import { useGetFilesQuery } from "@/queries/files";
import {
  ActionIcon,
  Alert,
  Kbd,
  Loader,
  MultiSelect,
  Tooltip,
} from "@mantine/core";
import { getHotkeyHandler } from "@mantine/hooks";
import { IconRefresh } from "@tabler/icons-react";

type Prop = {
  onChange: (value: string[]) => void;
  onBlur: () => void;
  onCancel: () => void;
  value: string[];
  clearable?: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
};

export const MultiFilesSelect = ({
  onChange,
  onBlur,
  onCancel,
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

  const data = filesQuery.data;

  return (
    <MultiSelect
      name="multifile-select"
      placeholder={
        value.length === 0
          ? "Search for a request file"
          : "Search for a request file or press tab to confirm"
      }
      data={data}
      onChange={onChange}
      value={value}
      leftSection={icon}
      rightSection={value.length > 0 ? <Kbd size="sm">Tab</Kbd> : null}
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
        ["Escape", onCancel],
        ["mod+Enter", onBlur],
      ])}
    />
  );
};
