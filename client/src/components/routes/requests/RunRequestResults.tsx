import { RequestRunResponse } from "server-types";
import { TestResultAlert } from "@/components/routes/requests/TestResultAlert";
import { CopyCodeCard } from "@/components/common/CopyCodeCard";

type RunRequestResultsProps =
  | {
      isPreview: true;
      exportedRequest: string;
    }
  | {
      isPreview: false;
      exportedRequest: string;
      expectedResponse?: string;
      exportedResponse: string;
      requestRunResponse: RequestRunResponse;
    };

export const RunRequestResults = (props: RunRequestResultsProps) => {
  const { isPreview, exportedRequest } = props;

  return (
    <>
      <CopyCodeCard
        title="Request"
        text={exportedRequest}
        data-testid={props.isPreview ? "request-body-preview" : "request-body"}
      />

      {!isPreview && <RunRequestResponseResults {...props} />}
    </>
  );
};

type RunRequestResponseResultsProps = Extract<
  RunRequestResultsProps,
  { isPreview: false }
>;

const RunRequestResponseResults = ({
  exportedResponse,
  expectedResponse,
  requestRunResponse,
}: RunRequestResponseResultsProps) => (
  <>
    <CopyCodeCard
      title="Response"
      text={exportedResponse}
      data-testid="response-body"
    />

    {expectedResponse && (
      <TestResultAlert testResult={requestRunResponse.test_result} />
    )}
  </>
);
