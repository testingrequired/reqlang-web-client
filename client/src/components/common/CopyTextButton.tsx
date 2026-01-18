import { ActionIcon, CopyButton, Tooltip } from "@mantine/core";
import { IconCopy, IconCopyCheckFilled } from "@tabler/icons-react";

type Props = {
  value: string | undefined | null;
  onCopy?: (copiedValue: string) => void;
};

export const CopyTextButton = ({ value, onCopy }: Props) => {
  return (
    <div data-testid="copy-button">
      <CopyButton value={value ?? ""}>
        {(copyHandlers) => (
          <Tooltip label="Copy">
            <ActionIcon
              onClick={() => {
                copyHandlers?.copy?.();
                onCopy?.(value ?? "");
              }}
              color="dark"
              aria-label="Copy"
            >
              {copyHandlers?.copied ? (
                <IconCopyCheckFilled stroke={1} />
              ) : (
                <IconCopy stroke={1} />
              )}
            </ActionIcon>
          </Tooltip>
        )}
      </CopyButton>
    </div>
  );
};
