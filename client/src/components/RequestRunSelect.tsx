import { Select } from "@mantine/core";
import moment from "moment";
import { RequestRun } from "server-types";

type Props = {
  requestRunHistory: RequestRun[];
  value: number | null;
  onChange: (value: number | null) => void;
};

export const RequestRunSelect = ({
  requestRunHistory,
  value,
  onChange,
}: Props) => {
  return (
    <Select
      placeholder="Select a request run in history"
      data={requestRunHistory.map((run, i) => {
        const date = moment(run.request_at as unknown as number);
        return {
          value: `${i}`,
          label: `${date.calendar()} (${date.fromNow()})`,
        };
      })}
      value={value?.toString(10)}
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
