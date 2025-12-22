import { RequestRun } from "server-types";
import { RequestRunHistoryItem } from "./RequestRunHistoryItem";
import { useColorScheme, useDisclosure } from "@mantine/hooks";
import { ActionIcon, Badge, Card, Group, TooltipFloating } from "@mantine/core";
import { IconCaretDownFilled, IconCaretUpFilled } from "@tabler/icons-react";
import { Link } from "@tanstack/react-router";
import moment from "moment";

type Props = {
  requestRun: RequestRun;
};

export const RequestRunHistoryItemCollapsable = ({ requestRun }: Props) => {
  const [isFullView, fullViewHandlers] = useDisclosure(false);
  const requestAt = moment(requestRun.request_at as unknown as number);
  const requestAtStr = requestAt.toLocaleString();
  const colorScheme = useColorScheme();

  return (
    <Card>
      <Group justify="space-between">
        <Group mb={isFullView ? "md" : "0"}>
          <ActionIcon onClick={fullViewHandlers.toggle}>
            {isFullView ? <IconCaretDownFilled /> : <IconCaretUpFilled />}
          </ActionIcon>

          <TooltipFloating label={requestAtStr} position="bottom">
            <Badge
              variant="transparent"
              color={colorScheme === "dark" ? "white" : "dark"}
              style={{
                cursor: "help",
              }}
            >
              {requestAt.fromNow()}
            </Badge>
          </TooltipFloating>

          <Link
            to="/history"
            search={{
              requestFilePath: requestRun.request_file_path,
            }}
          >
            <Badge
              variant="transparent"
              color={colorScheme === "dark" ? "white" : "dark"}
              style={{
                cursor: "pointer",
              }}
            >
              {requestRun.request_file_path}
            </Badge>
          </Link>
        </Group>

        <Group justify="space-evenly">
          <Link
            to="/history"
            search={(prev) => ({
              ...prev,
              testResult: requestRun.pass ? "pass" : "fail",
              requestFilePath: requestRun.request_file_path,
            })}
          >
            <Badge
              radius="sm"
              variant={colorScheme === "dark" ? "transparent" : "light"}
              color={requestRun.pass ? "green" : "red"}
              style={{
                cursor: "pointer",
              }}
            >
              {requestRun.pass ? "Pass" : "Fail"}
            </Badge>
          </Link>
          <Link
            to="/history"
            search={{
              runId: requestRun.uuid,
            }}
          >
            <Badge
              radius="lg"
              variant="transparent"
              color="dark"
              style={{
                cursor: "pointer",
              }}
            >
              {requestRun.uuid.slice(0, 5)}
            </Badge>
          </Link>
        </Group>
      </Group>

      {isFullView && (
        <Card>
          <RequestRunHistoryItem requestRun={requestRun} />
        </Card>
      )}
    </Card>
  );
};
