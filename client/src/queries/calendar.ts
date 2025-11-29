import { useQuery } from "@tanstack/react-query";

export const CALENDAR_KEYS = {
  all: ["calendar"] as const,
} as const;

export const useViewCalendarQuery = () =>
  useQuery({
    queryKey: CALENDAR_KEYS.all,
    queryFn: async () => {
      await fetch(`/api/calendar`, {
        method: "POST",
      });
    },
  });
