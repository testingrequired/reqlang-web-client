import {
  useClearRunHistoryMutation,
  useGetRunHistoryQuery,
} from "@/queries/history";
import { Button, Text } from "@mantine/core";
import { modals } from "@mantine/modals";

export const DeleteHistoryButton = () => {
  const getRunHistoryQuery = useGetRunHistoryQuery();
  const deleteHistoryMutation = useClearRunHistoryMutation();

  const history = getRunHistoryQuery.data ?? [];

  return (
    <Button
      onClick={openClearHistoryConfirmModal(deleteHistoryMutation.mutate)}
      color="red"
      size="compact-sm"
      variant="outline"
      loading={deleteHistoryMutation.isPending || getRunHistoryQuery.isPending}
      disabled={history.length === 0}
    >
      Delete History
    </Button>
  );
};

function openClearHistoryConfirmModal(onConfirm: () => void): () => void {
  return () =>
    modals.openConfirmModal({
      title: "Are you sure?",
      children: (
        <Text size="sm">
          This will clear all runs from the run history and can't be undone.
        </Text>
      ),
      labels: { confirm: "Clear History", cancel: "Cancel" },
      onConfirm,
    });
}
