import { describe, expect, test, vi } from "vitest";
import { screen } from "@testing-library/react";

import "@testing-library/jest-dom/vitest";
import { CopyTextButton } from "./CopyTextButton";
import { renderComponentForTest } from "@/testutils";

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
