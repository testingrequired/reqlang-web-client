import { CopyCode } from "@/components/common/CopyCode";
import { Alert, Card, Stack, Text } from "@mantine/core";
import { RequestRunResponse } from "server-types";

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
  return (
    <>
      <Text mb={0} size="xl" fw="bold">
        Results
      </Text>
      <Card>
        <Text pb={0} fw="bold">
          Request
        </Text>
        <div
          data-testid={
            props.isPreview ? "request-body-preview" : "request-body"
          }
        >
          <CopyCode text={props.exportedRequest}>
            {props.exportedRequest}
          </CopyCode>
        </div>
      </Card>

      {!props.isPreview && (
        <>
          <Card>
            <Text pb={0} fw="bold">
              {props.expectedResponse ? "Actual Response" : "Response"}
            </Text>

            <div data-testid="response-body">
              <CopyCode text={props.exportedResponse}>
                {props.exportedResponse}
              </CopyCode>
            </div>

            <Stack>
              <Text size="sm">
                Time Taken: {props.requestRunResponse.time_taken} ms
              </Text>
            </Stack>
          </Card>

          {props.expectedResponse && (
            <>
              {!props.requestRunResponse.test_result.pass ? (
                <>
                  <Alert color="red" title="Test Result: Failed!" w="100%">
                    <CopyCode text={props.requestRunResponse.test_result.diff!}>
                      {props.requestRunResponse.test_result.diff}
                    </CopyCode>
                  </Alert>
                </>
              ) : (
                <Alert color="green" title="Test Result: Passed!"></Alert>
              )}

              <Card>
                <Text pb={0} fw="bold">
                  Expected Response
                </Text>

                <CopyCode text={props.expectedResponse}>
                  {props.expectedResponse}
                </CopyCode>
              </Card>
            </>
          )}
        </>
      )}
    </>
  );
};
