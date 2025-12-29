import { ButtonGroup, Code, Group } from "@mantine/core";
import { CopyTextButton } from "./CopyTextButton";
import { ReactNode } from "react";

type Props = {
  text: string;
  children: string | ReactNode;
  onCopy?: (copiedValue: string) => void;
};

export const CopyCode = ({ children, text, onCopy }: Props) => {
  return (
    <Group align="stretch" justify="space-between" gap="xs">
      <Code block w="92%" m={0}>
        {children}
      </Code>

      <ButtonGroup w="5%" m={0} p={0}>
        <CopyTextButton value={text} onCopy={onCopy} />
      </ButtonGroup>
    </Group>
  );
};
