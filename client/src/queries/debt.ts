import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CreateDebtDto, DebtDto, UpdateDebtDto } from "server-types";
import { TIMELINE_KEYS } from "./timeline";
import { useLogger } from "@/hooks/useLogger";

type DebtId = DebtDto["id"];

export const DEBT_KEYS = {
  all: ["debts"] as const,
  list: () => [...DEBT_KEYS.all, "list"] as const,
  byId: (id: DebtId) => [...DEBT_KEYS.list(), id] as const,
} as const;

export const useGetDebtsQuery = () =>
  useQuery({
    queryKey: DEBT_KEYS.list(),
    queryFn: async () => {
      const response = await fetch(`/api/debts`);
      const data = (await response.json()) as DebtDto[];

      return data;
    },
  });

export const useGetDebtByIdQuery = (id: DebtId) =>
  useQuery({
    queryKey: DEBT_KEYS.byId(id),
    queryFn: async () => {
      const response = await fetch(`/api/debts/${id}`);
      const data = (await response.json()) as DebtDto;

      return data;
    },
  });

type DeleteDebtCallbacks = {
  onRequestSuccess?: () => void;
};

export const useDeleteDebtMutation = (
  id: DebtDto["id"],
  callbacks?: DeleteDebtCallbacks
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await fetch(`/api/debts/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: DEBT_KEYS.all,
      });

      queryClient.invalidateQueries({
        queryKey: TIMELINE_KEYS.all,
      });

      callbacks?.onRequestSuccess?.call(undefined);
    },
  });
};

type UpdateDebtCallbacks = {
  onRequestSuccess?: () => void;
  onRequestError?: (e: Error) => void;
  onValidationErrors?: (errs: string[]) => void;
};

export const useUpdateDebtMutation = (
  id: DebtId,
  callbacks?: UpdateDebtCallbacks
) => {
  const queryClient = useQueryClient();
  const logger = useLogger();

  return useMutation({
    mutationFn: async (update: UpdateDebtDto) => {
      logger("info", `Updating debt ${id}`);

      const response = await fetch(`/api/debts/${id}`, {
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
          logger(
            "error",
            `Updating debt ${id} failed due to a bad request: ${json}`
          );
          callbacks?.onValidationErrors?.call(undefined, errs);
        }

        throw new Error(`Error saving debt`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: DEBT_KEYS.all,
      });

      queryClient.invalidateQueries({
        queryKey: TIMELINE_KEYS.all,
      });

      logger("info", `Updated debt ${id}`);
      callbacks?.onRequestSuccess?.call(undefined);
    },
    onError: (e) => {
      logger("error", `Failed to update debt ${id}: ${e}`);
    },
  });
};

type CreateDebtCallbacks = {
  onRequestSuccess?: () => void;
  onRequestError?: (e: Error) => void;
  onValidationErrors?: (errs: string[]) => void;
};

export const useCreateDebtMutation = (callbacks?: CreateDebtCallbacks) => {
  const queryClient = useQueryClient();
  const logger = useLogger();

  return useMutation({
    mutationFn: async (transaction: CreateDebtDto) => {
      logger("info", `Creating debt: ${JSON.stringify(transaction)}`);

      const response = await fetch(`/api/debts`, {
        method: "POST",
        body: JSON.stringify(transaction),
        headers: {
          "content-type": "application/json",
        },
      });

      if (!response.ok) {
        if (response.status === 400) {
          const json = await response.text();
          logger("error", `Unable to create debt: ${json}`);
          const errs = JSON.parse(json) as string[];
          callbacks?.onValidationErrors?.call(undefined, errs);
        }

        throw new Error(`Error saving debt`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DEBT_KEYS.all });

      queryClient.invalidateQueries({
        queryKey: TIMELINE_KEYS.all,
      });

      logger("info", "Debt created successfully");

      callbacks?.onRequestSuccess?.call(undefined);
    },
    onError: (e) => {
      logger("error", `Unable to create debt: ${e}`);
      callbacks?.onRequestError?.call(undefined, e);
    },
  });
};
