import React from "react";
import { describe, expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import { App } from "../src/App";

import "@testing-library/jest-dom/vitest";

describe("App", () => {
  test.skip("renders", () => {
    render(<App />);

    expect(screen.getByText("Home")).toBeVisible();
    expect(screen.getByText("...")).toBeVisible();
  });
});
