import { expect, Locator, Page } from "@playwright/test";

/**
 * This is set to a temporary directory by the justfile in `e2e`
 */
export const RQL_PROJECT_DIR = process.env.RQL_PROJECT_DIR;

export interface IPageObject {
  getLocator(): Locator;
}

export class PageObject implements IPageObject {
  constructor(
    protected readonly page: Page,
    protected readonly root: Locator,
  ) {}

  getLocator(): Locator {
    return this.root;
  }

  async expectToBeVisible() {
    await expect(this.getLocator()).toBeVisible();
  }

  async click() {
    await this.click();
  }
}
