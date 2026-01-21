import { CopyCode } from "@/components/common/CopyCode";
import { Alert } from "@mantine/core";
import { RequestRun, RequestRunResponseTestResult } from "server-types";
import stripAnsi from "strip-ansi";

type Props = {
  testResult: RequestRunResponseTestResult | RequestRun;
};

export const TestResultAlert = ({ testResult }: Props) => {
  return !testResult.pass ? (
    <>
      <Alert color="red" title="Test Result: Failed!" w="100%" maw="100%">
        <CopyCode text={stripAnsi(testResult.diff!)}>
          {stripAnsi(testResult.diff!)}
        </CopyCode>
      </Alert>
    </>
  ) : (
    <Alert color="green" title="Test Result: Passed!" />
  );
};
