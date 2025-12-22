import { RequestRun } from "server-types";
import { RequestRunHistoryItem } from "./RequestRunHistoryItem";
import { useDisclosure } from "@mantine/hooks";
import { ActionIcon, Badge, Card, Group } from "@mantine/core";
import { IconCaretDownFilled, IconCaretUpFilled } from "@tabler/icons-react";
import { Link } from "@tanstack/react-router";
import moment from "moment";

type Props = {
  requestRun: RequestRun;
};

export const RequestRunHistoryItemCollapsable = ({ requestRun }: Props) => {
  const [isFullView, fullViewHandlers] = useDisclosure(false);
  return (
    <Card>
      <Group justify="space-between">
        <Group mb={isFullView ? "md" : "0"}>
          <ActionIcon onClick={fullViewHandlers.toggle}>
            {isFullView ? <IconCaretDownFilled /> : <IconCaretUpFilled />}
          </ActionIcon>

          <Badge variant="transparent" color="white">
            {moment(requestRun.request_at as unknown as number).fromNow()}
          </Badge>

          <Link
            to="/history"
            search={{
              requestFilePath: requestRun.request_file_path,
            }}
          >
            <Badge
              variant="transparent"
              color="white"
              style={{
                cursor: "pointer",
              }}
            >
              {requestRun.request_file_path}
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
              {requestRun.uuid.slice(0, 8)}
            </Badge>
          </Link>
        </Group>

        <Link
          to="/history"
          search={(prev) => ({
            ...prev,
            testResult: requestRun.pass ? "pass" : "fail",
          })}
        >
          <Badge
            radius="lg"
            variant="transparent"
            color={requestRun.pass ? "green" : "red"}
            style={{
              cursor: "pointer",
            }}
          >
            {requestRun.pass ? "Pass" : "Fail"}
          </Badge>
        </Link>
      </Group>

      {isFullView && (
        <Card>
          <RequestRunHistoryItem requestRun={requestRun} />
        </Card>
      )}
    </Card>
  );
};
