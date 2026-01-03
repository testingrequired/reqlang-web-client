import { expect, Locator, Page } from "@playwright/test";
import { PageObject } from ".";

export class RootView extends PageObject {
  readonly nav: Locator;
  readonly homeLink: Locator;
  readonly requestLink: Locator;
  readonly runHistoryLink: Locator;
  readonly debugLink: Locator;

  constructor(page: Page) {
    super(page, page.getByTestId("root"));

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

  public async gotoRequests(): Promise<RequestsView> {
    await this.requestLink.click();

    return new RequestsView(this.page);
  }
}

export class HomeView extends PageObject {
  readonly projectHeader: Locator;

  /**
   * Displays the absolute path to the open reqlang project
   */
  private readonly projectCwd: Locator;

  /**
   * Advises user there hasn't been able request runs yet
   */
  readonly latestRunsAlert: Locator;

  readonly doclinks: Locator;

  constructor(page: Page) {
    super(page, page.getByTestId("home-view"));
    this.projectHeader = this.root.getByRole("heading", {
      name: "Project",
    });
    this.projectCwd = this.root.getByTestId("project-cwd");
    this.latestRunsAlert = this.root.getByTestId("latest-runs-alert");
    this.doclinks = this.root
      .getByTestId("doclinks")
      .getByRole("listitem")
      .getByRole("link");
  }

  async projectCwdText(): Promise<string> {
    return this.projectCwd.textContent();
  }

  async docLinkUrls(): Promise<string[]> {
    return await Promise.all(
      (await this.doclinks.all()).map((link) => link.getAttribute("href"))
    );
  }

  async expectHasLatestRunsAlert() {
    await expect(this.latestRunsAlert).toBeVisible();
  }

  async expectHasDocLinks(expected: Record<string, string>) {
    await expect.soft(this.doclinks).toHaveText(Object.keys(expected));

    await expect
      .soft(this.docLinkUrls())
      .resolves.toStrictEqual(Object.values(expected));
  }
}

export class OpenedRequestFilesForm extends PageObject {
  readonly openFileSelectorButton: Locator;
  readonly closeAllButton: Locator;
  readonly selectTextbox: Locator;
  readonly selectOptions: Locator;

  constructor(readonly page: Page) {
    super(page, page.getByTestId("requests-view"));

    this.openFileSelectorButton = this.root.getByRole("button", {
      name: "Open/Close Request Files",
    });
    this.closeAllButton = this.root.getByRole("button", {
      name: "Close All Request Files",
    });
    this.selectTextbox = this.root.getByRole("textbox", {
      name: "Select a request file",
    });
    this.selectOptions = this.root.getByRole("option");
  }

  async openFileSelector() {
    await this.openFileSelectorButton.click();
  }

  async selectRequestFile(requestFile: string) {
    return this.root
      .getByRole("option", {
        name: requestFile,
      })
      .click();
  }

  async blur() {
    return this.selectTextbox.press("Tab");
  }

  async expectHasOpenFileSelectorButton() {
    await expect(this.openFileSelectorButton).toBeVisible();
  }

  async expectNotToHaveOpenFileSelectorButton() {
    await expect(this.openFileSelectorButton).not.toBeVisible();
  }

  async expectHasCloseAllButton() {
    await expect(this.closeAllButton).toBeVisible();
  }

  async expectNotToHaveCloseAllButton() {
    await expect(this.closeAllButton).not.toBeVisible();
  }

  async expectToHaveTextbox() {
    await expect(this.selectTextbox).toBeVisible();
  }

  async expectToHaveSelectOptions(expectedOptions: string[]) {
    await expect(this.selectOptions).toHaveText(expectedOptions);
  }
}

export class RequestsView extends PageObject {
  readonly openRequestFilesForm: OpenedRequestFilesForm;
  readonly openFileTabs: OpenRequestFilesTabs;

  constructor(page: Page) {
    super(page, page.getByTestId("requests-view"));
    this.openRequestFilesForm = new OpenedRequestFilesForm(page);
    this.openFileTabs = new OpenRequestFilesTabs(page);
  }
}

export class OpenRequestFilesTabs extends PageObject {
  readonly tabList: Locator;
  readonly tabs: Locator;
  readonly tabPanel: Locator;

  constructor(page: Page) {
    super(page, page.getByTestId("open-request-file-tabs"));

    this.tabList = this.root.getByRole("tablist");
    this.tabs = this.tabList.getByRole("tab");
    this.tabPanel = this.root.getByTestId("open-request-file-tabs-panel");
  }

  getTab(requestFile: string): Locator {
    return this.tabList.getByRole("tab", {
      name: requestFile,
    });
  }

  async expectHasTab(requestFile: string) {
    await expect(this.getTab(requestFile)).toBeVisible();
  }

  async expectNotHaveTab(requestFile: string) {
    await expect(this.getTab(requestFile)).toBeHidden();
  }

  async expectTabPanelOpen() {
    await expect(this.tabPanel).toBeVisible();
  }

  async expectTabPanelClosed() {
    await expect(this.tabPanel).toBeHidden();
  }

  closeTab(requestFile: string): Locator {
    return this.tabList.getByRole("button", {
      name: `Close ${requestFile}`,
    });
  }
}
