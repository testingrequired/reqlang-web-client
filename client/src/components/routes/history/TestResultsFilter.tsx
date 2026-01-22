import { Select } from "@mantine/core";
import { routeApi } from "@/components/routes/history/HistoryRoute";

export const TestResultFilter = () => {
  const nav = routeApi.useNavigate();
  const search = routeApi.useSearch();

  let selectedTestResult: "pass" | "fail" | null;

  if (typeof search.testResult === "undefined") {
    selectedTestResult = null;
  } else {
    selectedTestResult = search.testResult;
  }

  return (
    <Select
      value={selectedTestResult}
      placeholder="Filter by test result"
      onChange={(value) =>
        nav({
          //@ts-ignore The `data` prop is being passed "pass" & "fail" below
          search: (prev) => ({
            ...prev,
            testResult: value,
          }),
        })
      }
      data={[
        { value: "pass", label: "Tests Passed" },
        { value: "fail", label: "Tests Failed" },
      ]}
    />
  );
};
