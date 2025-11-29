import { BillDto, TransactionDto } from "server-types";
import {
  DND_TYPE_BILL,
  DND_TYPE_NEW_TRANSACTION,
  DND_TYPE_TRANSACTION,
} from "@/constants";

export type Droppable =
  | {
      kind: typeof DND_TYPE_BILL;
      item: BillDto;
    }
  | {
      kind: typeof DND_TYPE_TRANSACTION;
      item: TransactionDto;
    }
  | {
      kind: typeof DND_TYPE_NEW_TRANSACTION;
    };
