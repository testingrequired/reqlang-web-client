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

test("has home link", async ({ page }) => {
  await expect(root.homeLink).toBeVisible();
});

test("has bills link", async ({ page }) => {
  await expect(root.billsLink).toBeVisible();
});

test("has calendar link", async ({ page }) => {
  await expect(root.calendarLink).toBeVisible();
});

test("has transactions link", async ({ page }) => {
  await expect(root.transactionsLink).toBeVisible();
});

test("has debug link", async ({ page }) => {
  await expect(root.debugLink).toBeVisible();
});
