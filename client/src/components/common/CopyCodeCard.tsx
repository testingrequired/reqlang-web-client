import { CopyCode } from "@/components/common/CopyCode";
import { Card, Text } from "@mantine/core";

type CopyCodeCardProps = {
  title: string;
  ["data-testid"]?: string;
  text: string;
};
export const CopyCodeCard: React.FC<CopyCodeCardProps> = ({
  title,
  text,
  ["data-testid"]: dataTestId,
}) => (
  <Card p="sm">
    <Text pb={0} mb="sm" fw="bold" size="sm">
      {title}
    </Text>

    <CopyCode text={text} data-testid={dataTestId}>
      {text}
    </CopyCode>
  </Card>
);
