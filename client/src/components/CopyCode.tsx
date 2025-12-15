import { ButtonGroup, Code, Group } from "@mantine/core";
import { CopyTextButton } from "./CopyTextButton";

type Props = {
  children: string;
};

export const CopyCode = ({ children }: Props) => {
  return (
    <Group align="stretch">
      <Code block w="90%">
        {children}
      </Code>

      <ButtonGroup w="5%">
        <CopyTextButton value={children} />
      </ButtonGroup>
    </Group>
  );
};
