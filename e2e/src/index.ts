import { expect, Locator, Page } from "@playwright/test";

/**
 * This is set to a temporary directory by the justfile in `e2e`
 */
export const REQLANG_PROJECT_DIR = process.env.REQLANG_PROJECT_DIR;

export class RootView {
  readonly root: Locator;
  readonly nav: Locator;
  readonly homeLink: Locator;
  readonly requestLink: Locator;
  readonly runHistoryLink: Locator;
  readonly debugLink: Locator;

  constructor(private readonly page: Page) {
    this.root = this.page.getByTestId("root");
    this.nav = this.root.getByRole("navigation");
    this.homeLink = this.nav.getByRole("link", { name: "Home" });
    this.requestLink = this.nav.getByRole("link", { name: "Request" });
    this.runHistoryLink = this.nav.getByRole("link", { name: "Run History" });
    this.debugLink = this.nav.getByRole("link", { name: "Debug" });
  }

  public async goto(): Promise<RootView> {
    await this.page.goto("/");

    await expect(this.root).toBeVisible();

    return this;
  }

  public async gotoHome(): Promise<HomeView> {
    await this.homeLink.click();

    return new HomeView(this.page);
  }
}

export class HomeView {
  readonly root: Locator;
  private readonly projectCwd: Locator;

  constructor(private readonly page: Page) {
    this.root = this.page.getByTestId("root");
    this.projectCwd = this.root.getByTestId("project-cwd");
  }

  async projectCwdText(): Promise<string> {
    return this.projectCwd.textContent();
  }
}
