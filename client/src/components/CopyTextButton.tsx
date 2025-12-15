import { ActionIcon, CopyButton, Tooltip } from "@mantine/core";
import { IconCopy, IconCopyCheckFilled } from "@tabler/icons-react";

type Props = {
  value: string | undefined | null;
};

export const CopyTextButton = ({ value }: Props) => {
  return (
    <CopyButton value={value ?? ""}>
      {({ copied, copy }) => (
        <Tooltip label="Copy">
          <ActionIcon onClick={copy} color="dark" aria-label="Copy">
            {copied ? (
              <IconCopyCheckFilled stroke={1} />
            ) : (
              <IconCopy stroke={1} />
            )}
          </ActionIcon>
        </Tooltip>
      )}
    </CopyButton>
  );
};
