import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BillDto, CreateBillDto, UpdateBillDto } from "server-types";
import { TIMELINE_KEYS } from "./timeline";

type BillId = BillDto["id"];

export const BILL_KEYS = {
  all: ["bills"] as const,
  list: () => [...BILL_KEYS.all, "list"] as const,
  byId: (id: BillId) => [...BILL_KEYS.list(), id] as const,
  nextDate: (id: BillId) => [...BILL_KEYS.byId(id), "nextDate"] as const,
  nextDates: () => [...BILL_KEYS.list(), "nextDates"] as const,
} as const;

export const useGetBillsQuery = () =>
  useQuery({
    queryKey: BILL_KEYS.list(),
    queryFn: async () => {
      const response = await fetch(`/api/bills`);
      const data = (await response.json()) as BillDto[];

      return data;
    },
  });

export const useGetBillByIdQuery = (id: BillId) =>
  useQuery({
    queryKey: BILL_KEYS.byId(id),
    queryFn: async () => {
      const response = await fetch(`/api/bills/${id}`);
      const data = (await response.json()) as BillDto;

      return data;
    },
  });

export const useBillNextDateQuery = (id: BillId) =>
  useQuery({
    queryKey: BILL_KEYS.nextDate(id),
    queryFn: async () => {
      const response = await fetch(`/api/bills/${id}/next_date`);
      const data = (await response.json()) as string;

      return data;
    },
  });

type UpdateBillCallbacks = {
  onRequestSuccess?: () => void;
  onRequestError?: (e: Error) => void;
  onValidationErrors?: (errs: string[]) => void;
};

export const useUpdateBillMutation = (
  id: BillId,
  callbacks?: UpdateBillCallbacks
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (update: UpdateBillDto) => {
      const response = await fetch(`/api/bills/${id}`, {
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
        }

        throw new Error(`Error saving bill`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: BILL_KEYS.all,
      });

      queryClient.invalidateQueries({
        queryKey: TIMELINE_KEYS.all,
      });

      callbacks?.onRequestSuccess?.call(undefined);
    },
    onError: (e) => {
      callbacks?.onRequestError?.call(undefined, e);
    },
  });
};

type DeleteBillCallbacks = {
  onRequestSuccess?: () => void;
};

export const useDeleteBillMutation = (
  id: BillId,
  callbacks?: DeleteBillCallbacks
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await fetch(`/api/bills/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: BILL_KEYS.all,
      });

      queryClient.invalidateQueries({
        queryKey: TIMELINE_KEYS.all,
      });

      callbacks?.onRequestSuccess?.call(undefined);
    },
  });
};

type BillIdToDate = [number, string];

export const useBillsNextDatesQuery = () =>
  useQuery({
    queryKey: BILL_KEYS.nextDates(),
    queryFn: async () => {
      const response = await fetch(`/api/bills/next_dates`);

      const data = (await response.json()) as BillIdToDate[];

      return data;
    },
  });

type CreateBillCallbacks = {
  onRequestSuccess?: () => void;
  onRequestError?: (e: Error) => void;
  onValidationErrors?: (errs: string[]) => void;
};

export const useCreateBillMutation = (callbacks?: CreateBillCallbacks) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (bill: CreateBillDto) => {
      const response = await fetch(`/api/bills`, {
        method: "POST",
        body: JSON.stringify(bill),
        headers: {
          "content-type": "application/json",
        },
      });

      if (!response.ok) {
        if (response.status === 400) {
          const json = await response.text();
          const errs = JSON.parse(json) as string[];
          callbacks?.onValidationErrors?.call(undefined, errs);
        }

        throw new Error(`Error saving bill`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BILL_KEYS.all });

      queryClient.invalidateQueries({
        queryKey: TIMELINE_KEYS.all,
      });

      callbacks?.onRequestSuccess?.call(undefined);
    },
    onError: (e) => {
      callbacks?.onRequestError?.call(undefined, e);
    },
  });
};
