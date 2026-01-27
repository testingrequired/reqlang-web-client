import { RequestRunResponse } from "server-types";
import { TestResultAlert } from "@/components/routes/requests/TestResultAlert";
import { CopyCodeCard } from "@/components/common/CopyCodeCard";
import { Indicator, Stack, Tabs } from "@mantine/core";
import { useEffect, useState } from "react";

type RunRequestResultsProps =
  | {
      isExporting: true;
      exportedRequest: string;
    }
  | {
      isExporting: false;
      exportedRequest: string;
      expectedResponse?: string;
      exportedResponse: string;
      requestRunResponse: RequestRunResponse;
    };

export const RunRequestResults = (props: RunRequestResultsProps) => {
  const { isExporting, exportedRequest } = props;
  const [currentTab, setCurrentTab] = useState<string | null>(null);

  useEffect(() => {
    setCurrentTab(isExporting ? "request" : "response");
  }, [isExporting]);

  const isNotExporting = !isExporting;

  return (
    <Tabs value={currentTab} onChange={setCurrentTab}>
      <Tabs.List>
        {isNotExporting && (
          <>
            <Tabs.Tab value="response">Response</Tabs.Tab>
            {props.expectedResponse && (
              <Indicator
                disabled={currentTab === "test"}
                color={
                  props.requestRunResponse.test_result.pass ? "green" : "red"
                }
                position="top-end"
                offset={9}
                size={6}
              >
                <Tabs.Tab
                  value="test"
                  color={
                    props.requestRunResponse.test_result.pass ? "green" : "red"
                  }
                >
                  Test
                </Tabs.Tab>
              </Indicator>
            )}
          </>
        )}
        <Tabs.Tab value="request">Request</Tabs.Tab>
      </Tabs.List>

      {isNotExporting && (
        <>
          <Tabs.Panel value="response" aria-level={3}>
            <>
              <CopyCodeCard
                text={props.exportedResponse}
                data-testid="response-body"
              />
            </>
          </Tabs.Panel>

          {props.expectedResponse && (
            <Tabs.Panel value="test" aria-level={3}>
              <Stack>
                <TestResultAlert
                  testResult={props.requestRunResponse.test_result}
                />

                <CopyCodeCard
                  title="Expected Response"
                  text={props.expectedResponse}
                />
              </Stack>
            </Tabs.Panel>
          )}
        </>
      )}

      <Tabs.Panel value="request" aria-level={3}>
        <CopyCodeCard
          text={exportedRequest}
          data-testid={
            props.isExporting ? "request-body-exported" : "request-body"
          }
        />
      </Tabs.Panel>
    </Tabs>
  );
};
