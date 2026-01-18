import { Select } from "@mantine/core";
import moment from "moment";
import { RequestRun } from "server-types";

type Props = {
  requestRunHistory: RequestRun[];
  value: string | null;
  onChange: (value: string | null) => void;
  showPathsInSelect?: boolean;
};

export const RequestRunSelect = ({
  requestRunHistory,
  value,
  onChange,
  showPathsInSelect = false,
}: Props) => {
  return (
    <Select
      placeholder="Select a run from request history"
      data={requestRunHistory.map((run) => {
        const uuid = run.uuid.slice(0, 8);
        const date = moment(run.request_at as unknown as number);
        const dateLabel = `${date.calendar()} (${date.fromNow()})`;
        const label = showPathsInSelect
          ? `${dateLabel} [${run.request_file_path}]`
          : dateLabel;

        return {
          value: `${run.uuid}`,
          label: `${run.pass ? "✅" : "❌"} ${label} [${uuid}]`,
        };
      })}
      value={value}
      onChange={(newValue) => {
        if (newValue === null) {
          onChange(null);
        } else {
          onChange(newValue);
        }
      }}
      clearable
    />
  );
};
