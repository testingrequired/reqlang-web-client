import { Button } from "@mantine/core";

export type CloseRequestFileButtonProps = {
  onClick: () => void;
};

export const CloseRequestFileButton: React.FC<CloseRequestFileButtonProps> = (
  props
) => (
  <Button
    onClick={props.onClick}
    color="red"
    size="compact-xs"
    style={{
      cursor: "pointer",
    }}
  >
    Close
  </Button>
);
