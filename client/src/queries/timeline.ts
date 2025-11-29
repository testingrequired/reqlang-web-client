import { useLogger } from "@/hooks/useLogger";
import { useQuery } from "@tanstack/react-query";
import { Timeline } from "server-types";

export const TIMELINE_KEYS = {
  all: ["timeline"] as const,
  list: () => [...TIMELINE_KEYS.all, "list"] as const,
} as const;

export const useGetTimelineQuery = () => {
  const logger = useLogger();

  return useQuery({
    queryKey: TIMELINE_KEYS.all,
    queryFn: async () => {
      logger("info", "Fetching timeline...");
      const response = await fetch(`/api/timeline`);
      const data = (await response.json()) as Timeline;
      logger("info", `Recieved ${data.items.length} timeline events`);

      return data;
    },
  });
};
