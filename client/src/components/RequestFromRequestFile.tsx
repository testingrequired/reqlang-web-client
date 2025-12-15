import { ActionIcon, ButtonGroup, Code, Stack, Tooltip } from "@mantine/core";
import { ParseResult } from "reqlang-types";
import { CopyTextButton } from "./CopyTextButton";
import { IconRefresh } from "@tabler/icons-react";

type Props = {
  result: ParseResult;
  requestFileText: string;
  onRefreshFile?: () => void;
};

export const RequestFromRequestFile = ({
  result,
  requestFileText,
  onRefreshFile,
}: Props) => {
  const requestSpan = result.full.request[1];
  const requestText = requestFileText.slice(requestSpan.start, requestSpan.end);

  return (
    <Stack>
      <Code block>{requestText}</Code>

      <ButtonGroup>
        <CopyTextButton value={requestText} />

        {onRefreshFile && (
          <Tooltip label="Reload Request File">
            <ActionIcon
              color="dark"
              variant="filled"
              aria-label="Reload Request File"
              onClick={() => {
                onRefreshFile?.apply(null);
              }}
            >
              <IconRefresh stroke={1} />
            </ActionIcon>
          </Tooltip>
        )}
      </ButtonGroup>
    </Stack>
  );
};
