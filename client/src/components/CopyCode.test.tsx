import { describe, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";

import "@testing-library/jest-dom/vitest";
import { MantineProvider } from "@mantine/core";
import { CopyCode } from "./CopyCode";

describe("CopyCode", () => {
  test("copies text to navigator.clipboard when clicked", async () => {
    const expectedText = "tacos";
    const copiedCallbackSpy = vi.fn();

    renderComponentForTest(
      <CopyCode text={expectedText} onCopy={copiedCallbackSpy}>
        {expectedText}
      </CopyCode>
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
