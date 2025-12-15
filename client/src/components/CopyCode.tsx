import { ButtonGroup, Code, Group } from "@mantine/core";
import { CopyTextButton } from "./CopyTextButton";

type Props = {
  children: string;
};

export const CopyCode = ({ children }: Props) => {
  return (
    <Group align="stretch" justify="space-between" gap="xs">
      <Code block w="92%" m={0}>
        {children}
      </Code>

      <ButtonGroup w="5%" m={0} p={0}>
        <CopyTextButton value={children} />
      </ButtonGroup>
    </Group>
  );
};
