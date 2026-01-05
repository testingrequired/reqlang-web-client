import { RequestRun } from "server-types";
import { RequestRunHistoryItem } from "./RequestRunHistoryItem";
import { useColorScheme, useDisclosure } from "@mantine/hooks";
import { ActionIcon, Badge, Card, Group, TooltipFloating } from "@mantine/core";
import { IconCaretDownFilled, IconCaretUpFilled } from "@tabler/icons-react";
import { Link } from "@tanstack/react-router";
import moment from "moment";

type Props = {
  requestRun: RequestRun;
  disableCollapsing?: boolean;
};

export const RequestRunHistoryItemCollapsable = ({
  requestRun,
  disableCollapsing = false,
}: Props) => {
  const [isFullView, fullViewHandlers] = useDisclosure(disableCollapsing);
  const requestAt = moment(requestRun.request_at as unknown as number);
  const requestAtStr = requestAt.toLocaleString();
  const colorScheme = useColorScheme();

  const cardPadding = "sm";
  const toggleButtonSize = "sm";
  const collapseHeaderTextSize = "md";

  return (
    <Card p={cardPadding}>
      <Group justify="space-between">
        <Group mb={isFullView ? "md" : "0"}>
          {!disableCollapsing && (
            <ActionIcon
              onClick={fullViewHandlers.toggle}
              size={toggleButtonSize}
            >
              {isFullView ? <IconCaretDownFilled /> : <IconCaretUpFilled />}
            </ActionIcon>
          )}

          <TooltipFloating label={requestAtStr} position="bottom">
            <Badge
              variant="transparent"
              color={colorScheme === "dark" ? "white" : "dark"}
              style={{
                cursor: "help",
              }}
              p={0}
              size={collapseHeaderTextSize}
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
              size={collapseHeaderTextSize}
            >
              {requestRun.request_file_path}
            </Badge>
          </Link>
        </Group>

        <Group justify="space-evenly" visibleFrom="xs">
          <Link
            to="/history"
            search={(_prev) => ({
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
              size={collapseHeaderTextSize}
            >
              {requestRun.pass ? "Pass" : "Fail"}
            </Badge>
          </Link>
          <Link
            to="/history/$runId"
            params={{
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
              size={collapseHeaderTextSize}
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
