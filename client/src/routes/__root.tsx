import { createRootRoute, Link, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { AppShell, Burger, Group, NavLink, Title } from "@mantine/core";

import "@mantine/core/styles.css";
import "@mantine/dates/styles.css";
import "@mantine/spotlight/styles.css";
import { useDisclosure } from "@mantine/hooks";
import { useState } from "react";
import { useServerWebSocket } from "@/hooks/useServerWebSocket";
import { notifications } from "@mantine/notifications";
import { useReward } from "react-rewards";
import { ServerMessage } from "server-types";

export const Route = createRootRoute({
  component: () => {
    const [opened, { toggle }] = useDisclosure();
    const [achievementId, setAchievementId] = useState<string>("");

    const { reward } = useReward(`achievement_${achievementId}`, "confetti", {
      startVelocity: 15,
      elementCount: 75,
      spread: 90,
      lifetime: 200,
    });

    useServerWebSocket(undefined, {
      onMessage(event: MessageEvent<string>) {
        const message = JSON.parse(event.data) as ServerMessage;

        if (message.type === "Achievement") {
          const achievement = message.data;

          notifications.show({
            message: achievement.description,
            color: "violet",
            id: `achievement_${achievementId}`,
            title: `🏆 ${achievement.title}`,
            position: "bottom-center",
            autoClose: 5000,
            onOpen: () => {
              reward();
            },
          });

          // This is required by the useReward hook to be able to show multiple
          // achievement notifications at the same time.
          setAchievementId(achievement.id.toString());
        }
      },
    });

    return (
      <AppShell
        header={{ height: 70 }}
        navbar={{
          width: 225,
          breakpoint: "sm",
          collapsed: { mobile: !opened },
        }}
        data-testid="root"
      >
        <AppShell.Header>
          <Group justify="space-between">
            <Group>
              <Burger
                opened={opened}
                onClick={toggle}
                hiddenFrom="sm"
                size="sm"
              />
              <Title m="sm">reqlang-web</Title>
            </Group>
          </Group>
        </AppShell.Header>

        <AppShell.Navbar>
          <NavLink
            label="Home"
            component={Link}
            to="/"
            activeProps={{
              style: { fontWeight: "bold" },
            }}
          />

          <NavLink
            label="Requests"
            component={Link}
            to="/requests"
            activeProps={{
              style: { fontWeight: "bold" },
            }}
          />

          <NavLink
            label="Run History"
            component={Link}
            to="/history"
            activeProps={{
              style: { fontWeight: "bold" },
            }}
          />

          <NavLink
            label="Debug"
            component={Link}
            to="/debug"
            activeProps={{
              style: { fontWeight: "bold" },
            }}
          />
        </AppShell.Navbar>

        <AppShell.Main>
          <Outlet />
        </AppShell.Main>
        <TanStackRouterDevtools />
      </AppShell>
    );
  },
});
