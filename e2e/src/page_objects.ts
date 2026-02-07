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

  public async gotoDebug(): Promise<DebugView> {
    await this.debugLink.click();

    return new DebugView(this.page);
  }
}

export class DebugView extends PageObject {
  readonly dbIsEncryptedRow: Locator;
  readonly dbIsEncryptedHeader: Locator;
  readonly dbIsEncryptedValue: Locator;

  constructor(page: Page) {
    super(page, page.getByTestId("debug-view"));

    this.dbIsEncryptedRow = this.root.getByTestId("database-is-encrypted");
    this.dbIsEncryptedHeader = this.dbIsEncryptedRow.locator("th");
    this.dbIsEncryptedValue = this.dbIsEncryptedRow.locator("td");
  }

  public async expectDbEncryptionIs(isEncrypted: boolean) {
    await expect(this.dbIsEncryptedValue).toHaveText(
      isEncrypted ? "Yes" : "No",
    );
  }
}

export class HomeView extends PageObject {
  readonly dbIsNotEncryptedAlert: Locator;

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

    this.dbIsNotEncryptedAlert = this.root.getByRole("alert", {
      name: "Database Is Not Encrypted",
    });

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
      (await this.doclinks.all()).map((link) => link.getAttribute("href")),
    );
  }

  async expectDoesNotHaveDbNotEncryptedAlert() {
    await expect(this.dbIsNotEncryptedAlert).not.toBeVisible();
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

export class ActiveRequestFile extends PageObject {
  readonly requestBodyTemplate: Locator;
  readonly runRequestForm: RunRequestForm;

  constructor(page: Page) {
    super(page, page.getByTestId("active-request-file"));
    this.requestBodyTemplate = this.root.getByTestId("request-body-template");
    this.runRequestForm = new RunRequestForm(page);
  }

  async expectToHaveRequestBodyTemplate(expected: string) {
    await expect(this.requestBodyTemplate).toHaveText(expected);
  }
}

export class RunRequestForm extends PageObject {
  readonly exportRequestToggle: Locator;
  readonly runRequestButton: Locator;
  readonly exportRequestButton: Locator;
  readonly exportFormatSelect: Locator;
  readonly exportFormatOptions: Locator;
  readonly requestBodyExport: Locator;
  readonly requestBody: Locator;
  readonly responseBody: Locator;

  constructor(page: Page) {
    super(page, page.getByTestId("run-request-form"));

    this.exportRequestToggle = this.root.getByText("Export Request");

    this.runRequestButton = this.root.getByRole("button", {
      name: "Run",
    });

    this.exportRequestButton = this.root.getByRole("button", {
      name: "Export",
    });

    this.exportFormatSelect = this.root.getByRole("textbox", {
      name: "Export Format",
    });

    this.exportFormatOptions = this.root.getByRole("option");

    this.requestBodyExport = this.root.getByTestId("request-body-exported");
    this.requestBody = this.root.getByTestId("request-body");
    this.responseBody = this.root.getByTestId("response-body");
  }

  async enableExportRequest() {
    await this.exportRequestToggle.click({
      timeout: 5000,
    });
  }

  async disableExportRequest() {
    await this.exportRequestToggle.setChecked(false);
  }

  async selectExportFormat(format: string) {
    await this.exportFormatSelect.click();

    await this.root
      .getByRole("option", {
        name: format,
      })
      .click();
  }

  async submitForm() {
    await this.runRequestButton.click();
  }

  async submitExportRequestForm() {
    await this.exportRequestButton.click();
  }

  async expectRequestBodyExport(expected: string) {
    await expect(this.requestBodyExport).toHaveText(expected);
  }

  async expectNoRequestBodyExport() {
    await expect(this.requestBodyExport).toBeHidden();
  }

  async expectHasRequestBody(expected: string) {
    await expect(this.requestBody).toHaveText(expected);
  }

  async expectNoRequestBody() {
    await expect(this.requestBody).toBeHidden();
  }

  async expectHasResponseBody(expected: string) {
    await expect(this.responseBody).toContainText(expected);
  }

  async expectNoResponseBody() {
    await expect(this.responseBody).toBeHidden();
  }

  async expectToHaveExportFormatSelected(expectedOption: string) {
    await expect(this.exportFormatSelect).toHaveValue(expectedOption);
  }

  async expectToHaveExportFormatOptions(expectedOptions: string[]) {
    await expect(this.exportFormatOptions).toHaveText(expectedOptions);
  }
}

export class OpenRequestFilesTabs extends PageObject {
  readonly tabList: Locator;
  readonly tabs: Locator;
  readonly tabPanel: Locator;
  readonly activeRequestFile: ActiveRequestFile;

  constructor(page: Page) {
    super(page, page.getByTestId("open-request-file-tabs"));

    this.tabList = this.root.getByRole("tablist");
    this.tabs = this.tabList.getByRole("tab");
    this.tabPanel = this.root.getByTestId("active-request-file-tab-panel");
    this.activeRequestFile = new ActiveRequestFile(page);
  }

  getTabByName(requestFile: string): Locator {
    return this.tabList.getByRole("tab", {
      name: requestFile,
    });
  }

  async expectHasFileTabOpen(requestFile: string) {
    await expect(this.getTabByName(requestFile)).toBeVisible();
  }

  async expectIsFileTabActive(requestFile: string) {
    await expect(this.getTabByName(requestFile)).toHaveAttribute(
      "data-active",
      "true",
    );
  }

  async expectNotHaveTab(requestFile: string) {
    await expect(this.getTabByName(requestFile)).toBeHidden();
  }

  async expectHasActiveRequestTabContents() {
    await expect.soft(this.tabPanel).toBeVisible();
    await expect.soft(this.activeRequestFile.getLocator()).toBeVisible();
  }

  async expectNotHaveActiveRequestTabContents() {
    await expect.soft(this.tabPanel).toBeHidden();
    await expect.soft(this.activeRequestFile.getLocator()).toBeHidden();
  }

  closeTab(requestFile: string): Locator {
    return this.tabList.getByRole("button", {
      name: `Close ${requestFile}`,
    });
  }
}
