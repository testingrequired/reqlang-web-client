import { describe, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";

import "@testing-library/jest-dom/vitest";
import { MantineProvider } from "@mantine/core";
import { CopyTextButton } from "./CopyTextButton";

describe("CopyTextButton", () => {
  test("copies text to navigator.clipboard when clicked", async () => {
    const expectedText = "tacos";
    const copiedCallbackSpy = vi.fn();

    renderComponentForTest(
      <CopyTextButton value={expectedText} onCopy={copiedCallbackSpy} />
    );

    const copyButton = screen.getByTestId("copy-button");

    expect(copyButton).toBeVisible();

    screen.getByLabelText("Copy").click();

    expect(copiedCallbackSpy).toHaveBeenCalledExactlyOnceWith(expectedText);
  });
});

function renderComponentForTest(children: React.ReactNode) {
  render(<MantineProvider>{children}</MantineProvider>);
}
