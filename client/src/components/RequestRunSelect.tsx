import { Select } from "@mantine/core";
import moment from "moment";
import { RequestRun } from "server-types";

type Props = {
  requestRunHistory: RequestRun[];
  value: number | null;
  onChange: (value: number | null) => void;
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
      data={requestRunHistory.map((run, i) => {
        const uuid = run.uuid.slice(0, 8);
        const date = moment(run.request_at as unknown as number);
        const dateLabel = `${date.calendar()} (${date.fromNow()})`;
        const label = showPathsInSelect
          ? `${dateLabel} [${run.request_file_path}]`
          : dateLabel;

        return {
          value: `${i}`,
          label: `${label} [${uuid}]`,
        };
      })}
      value={value === null ? null : value.toString(10)}
      onChange={(newValue) => {
        if (newValue === null) {
          onChange(null);
        } else {
          onChange(parseInt(newValue, 10));
        }
      }}
      clearable
    />
  );
};
