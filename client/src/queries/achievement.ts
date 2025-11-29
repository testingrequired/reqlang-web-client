import { useQuery } from "@tanstack/react-query";
import { AchievementDto } from "server-types";

export const ACHIEVEMENT_KEYS = {
  all: ["debts"] as const,
  list: () => [...ACHIEVEMENT_KEYS.all, "list"] as const,
} as const;

export const useGetAchievementsQuery = () =>
  useQuery({
    queryKey: ACHIEVEMENT_KEYS.list(),
    queryFn: async () => {
      const response = await fetch(`/api/achievements`);
      const data = (await response.json()) as AchievementDto[];

      return data;
    },
  });
