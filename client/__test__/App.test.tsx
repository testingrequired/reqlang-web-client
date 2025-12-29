import { describe, expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import { App } from "../src/App";
import { MantineProvider } from "@mantine/core";

describe("App", () => {
  test("renders", () => {
    renderComponentForTest(<App />);

    expect(screen.getByText("Home")).toBeVisible();
    expect(screen.getByText("Requests")).toBeVisible();
    expect(screen.getByText("Run History")).toBeVisible();
  });
});

function renderComponentForTest(children: React.ReactNode) {
  render(<MantineProvider>{children}</MantineProvider>);
}
