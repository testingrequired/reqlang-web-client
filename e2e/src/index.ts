import { expect, Locator, Page } from "@playwright/test";

export class RootView {
  readonly root: Locator;
  readonly requestLink: Locator;
  readonly debugLink: Locator;

  constructor(private readonly page: Page) {
    this.root = this.page.getByTestId("root");
    this.requestLink = this.root.getByRole("link", { name: "Request" });
    this.debugLink = this.root.getByRole("link", { name: "Debug" });
  }

  public async goto(): Promise<RootView> {
    await this.page.goto("/");

    await expect(this.root).toBeVisible();

    return this;
  }
}
