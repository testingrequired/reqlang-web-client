import { BillDto, TransactionDto } from "server-types";

export const getTransactionDescription = (transaction: TransactionDto) => {
  return transaction.description;
};

export const getTransactionAmount = (transaction: TransactionDto) => {
  const value = transaction.amount.toString();
  const dollars = value.slice(0, -2);
  const cents = value.slice(-2);
  const sign = transaction.kind === "Debit" ? "-" : " ";

  return `${sign}$${dollars}.${cents}`;
};

export const getBillAmount = (bill: BillDto) => {
  const value = bill.amount.toString();
  const dollars = value.slice(0, -2);
  const cents = value.slice(-2);

  return `$${dollars}.${cents}`;
};

export function ordinal_suffix_of(i: number) {
  let j = i % 10,
    k = i % 100;
  if (j === 1 && k !== 11) {
    return i + "st";
  }
  if (j === 2 && k !== 12) {
    return i + "nd";
  }
  if (j === 3 && k !== 13) {
    return i + "rd";
  }
  return i + "th";
}

export function firstCalendarDate(date: Date) {
  // Take the input date’s year and month, but set day = 1 (first of month).
  const year = date.getFullYear();
  const month = date.getMonth();
  let firstOfMonth = new Date(year, month, 1);

  // Determine the weekday of the 1st (0 = Sunday, 1 = Monday, ...).
  const dayOfWeek = firstOfMonth.getDay();

  // Subtract the day index to go back to Sunday.
  // If dayOfWeek == 0, this leaves it unchanged. If >0, this rolls into previous month as needed.
  firstOfMonth.setDate(firstOfMonth.getDate() - dayOfWeek);

  return firstOfMonth;
}

export function lastCalendarDate(date: Date) {
  const year = date.getFullYear();
  const month = date.getMonth();

  // Get last day of the month
  let lastOfMonth = new Date(year, month + 1, 0);

  const dayOfWeek = lastOfMonth.getDay();
  const daysToAdd = 6 - dayOfWeek; // how many days until Saturday

  lastOfMonth.setDate(lastOfMonth.getDate() + daysToAdd);

  return lastOfMonth;
}
