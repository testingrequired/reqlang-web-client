import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CreateTransactionDto,
  TransactionDto,
  UpdateTransactionDto,
} from "server-types";
import { TIMELINE_KEYS } from "./timeline";
import { useLogger } from "@/hooks/useLogger";

type TransactionId = TransactionDto["id"];

export const TRANSACTION_KEYS = {
  all: ["transactions"] as const,
  list: () => [...TRANSACTION_KEYS.all, "list"] as const,
  byId: (id: TransactionId) => [...TRANSACTION_KEYS.list(), id] as const,
} as const;

export const useGetTransactionsQuery = () => {
  const logger = useLogger();

  return useQuery({
    queryKey: TRANSACTION_KEYS.list(),
    queryFn: async () => {
      logger("info", "Fetching transactions...");
      const response = await fetch(`/api/transactions`);
      const data = (await response.json()) as TransactionDto[];
      logger("info", `Fetched ${data.length} transactions`);

      return data;
    },
  });
};

export const useGetTransactionByIdQuery = (id: TransactionId) => {
  const logger = useLogger();

  return useQuery({
    queryKey: TRANSACTION_KEYS.byId(id),
    queryFn: async () => {
      logger("info", `Fetching transaction ${id}`);
      const response = await fetch(`/api/transactions/${id}`);
      const data = (await response.json()) as TransactionDto;
      logger("info", `Found transaction ${id}`);

      return data;
    },
  });
};

type UpdateTransactionCallbacks = {
  onRequestSuccess?: () => void;
  onRequestError?: (e: Error) => void;
  onValidationErrors?: (errs: string[]) => void;
};

export const useUpdateTransactionMutation = (
  id?: TransactionId,
  callbacks?: UpdateTransactionCallbacks
) => {
  const logger = useLogger();

  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (update: UpdateTransactionDto) => {
      logger("info", `Updating transaction ${id ?? update.id}`);

      const response = await fetch(`/api/transactions/${id ?? update.id}`, {
        method: "PUT",
        body: JSON.stringify(update),
        headers: {
          "content-type": "application/json",
        },
      });

      if (!response.ok) {
        if (response.status === 400) {
          const json = await response.text();
          const errs = JSON.parse(json) as string[];
          callbacks?.onValidationErrors?.call(undefined, errs);
          logger(
            "error",
            `Bad request trying to update transaction ${id}: ${json}`
          );
        }

        throw new Error(`Error saving transaction`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: TRANSACTION_KEYS.all,
      });

      queryClient.invalidateQueries({
        queryKey: TIMELINE_KEYS.all,
      });

      logger("info", `Transaction updated successfully`);

      callbacks?.onRequestSuccess?.call(undefined);
    },
    onError: (e) => {
      logger("error", `Failed to update transaction: ${e}`);
      callbacks?.onRequestError?.call(undefined, e);
    },
  });
};

type DeleteTransactionCallbacks = {
  onRequestSuccess?: () => void;
};

export const useDeleteTransactionMutation = (
  id: TransactionId,
  callbacks?: DeleteTransactionCallbacks
) => {
  const logger = useLogger();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      logger("info", `Deleting transaction ${id}`);
      await fetch(`/api/transactions/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: TRANSACTION_KEYS.all,
      });

      queryClient.invalidateQueries({
        queryKey: TIMELINE_KEYS.all,
      });

      logger("info", `Deleted transaction ${id} successfully`);

      callbacks?.onRequestSuccess?.call(undefined);
    },
    onError(e) {
      logger("error", `Deleting transaction ${id} failed: ${e}`);
    },
  });
};

type CreateTransactionCallbacks = {
  onRequestSuccess?: () => void;
  onRequestError?: (e: Error) => void;
  onValidationErrors?: (errs: string[]) => void;
};

export const useCreateTransactionMutation = (
  callbacks?: CreateTransactionCallbacks
) => {
  const logger = useLogger();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (transaction: CreateTransactionDto) => {
      logger(
        "info",
        `Creating new transaction: ${JSON.stringify(transaction)}`
      );
      await fetch(`/api/transactions`, {
        method: "POST",
        body: JSON.stringify(transaction),
        headers: {
          "content-type": "application/json",
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TRANSACTION_KEYS.all });

      queryClient.invalidateQueries({
        queryKey: TIMELINE_KEYS.all,
      });

      logger("info", "Creating new transaction succeeded`");

      callbacks?.onRequestSuccess?.call(undefined);
    },
    onError: (e) => {
      logger("error", `Creating new transaction failed: ${e}`);

      callbacks?.onRequestError?.call(undefined, e);
    },
  });
};
