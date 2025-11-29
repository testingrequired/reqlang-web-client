import { Button } from "@mantine/core";

export type CloseRequestFileButtonProps = {
  onClick: () => void;
};

export const CloseRequestFileButton: React.FC<CloseRequestFileButtonProps> = (
  props
) => <Button onClick={props.onClick}>Close</Button>;
