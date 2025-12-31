import { test, expect } from "@playwright/test";
import { HomeView, REQLANG_PROJECT_DIR, RootView } from "@/test";

let root: RootView;

test.beforeEach(async ({ page }) => {
  root = new RootView(page);

  await root.goto();
});

test("has title", async ({ page }) => {
  await expect(page).toHaveTitle("reqlang-web");
});

test.describe("Root", () => {
  test("has home link", async ({ page }) => {
    await expect(root.homeLink).toBeVisible();
  });

  test("has request link", async ({ page }) => {
    await expect(root.requestLink).toBeVisible();
  });

  test("has run history link", async ({ page }) => {
    await expect(root.runHistoryLink).toBeVisible();
  });

  test("has debug link", async ({ page }) => {
    await expect(root.debugLink).toBeVisible();
  });
});

test.describe("Home", () => {
  let home: HomeView;

  test.beforeEach(async () => {
    home = await root.gotoHome();
  });

  test("has title", async ({ page }) => {
    await expect(page).toHaveTitle("reqlang-web");
  });

  test("has project cwd", async () => {
    await expect(home.projectCwdText()).resolves.toBe(REQLANG_PROJECT_DIR);
  });
});
