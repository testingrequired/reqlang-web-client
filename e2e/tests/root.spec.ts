import { test, expect } from "@playwright/test";
import { RootView } from "../src";

let root: RootView;

test.beforeEach(async ({ page }) => {
  root = new RootView(page);

  await root.goto();
});

test("has title", async ({ page }) => {
  await expect(page).toHaveTitle("Reqlang");
});

test("has request link", async ({ page }) => {
  await expect(root.requestLink).toBeVisible();
});

test("has debug link", async ({ page }) => {
  await expect(root.debugLink).toBeVisible();
});
