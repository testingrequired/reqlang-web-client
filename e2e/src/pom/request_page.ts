import { expect, Locator, Page } from "@playwright/test";
import { PageObject } from "..";

export class OpenedRequestFilesForm extends PageObject {
  readonly openFileSelectorButton: Locator;
  readonly closeAllButton: Locator;
  readonly newDraftFileButton: Locator;
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
    this.newDraftFileButton = this.root.getByRole("button", {
      name: "Create New File",
    });
    this.selectTextbox = this.root.getByRole("textbox", {
      name: "Search for a request file",
    });
    this.selectOptions = this.root.getByRole("option");
  }

  async openFileSelector() {
    await this.openFileSelectorButton.click();
  }

  async addNewDraftFile() {
    await this.newDraftFileButton.click();
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

  async expectToHaveNewDraftFileButton() {
    await expect(this.newDraftFileButton).toBeVisible();
  }

  async expectToNotHaveNewDraftFileButton() {
    await expect(this.newDraftFileButton).not.toBeVisible();
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

export class ActiveDraftFile extends PageObject {
  readonly requestBodyTemplate: Locator;
  readonly tabs: ActiveDraftFileTabs;

  constructor(page: Page) {
    super(page, page.getByTestId("active-draft-file"));
    this.requestBodyTemplate = this.root.getByTestId("draft-body-template");
    this.tabs = new ActiveDraftFileTabs(page);
  }

  async expectToHaveRequestBodyTemplate(expected: string) {
    await expect(this.requestBodyTemplate).toHaveText(expected);
  }
}

export class ActiveDraftFileTabs extends PageObject {
  readonly tabList: Locator;
  readonly tabs: Locator;
  readonly tabPanel: Locator;
  readonly editTab: ActiveDraftFileEditTab;
  readonly runTab: ActiveDraftFileRunTab;

  constructor(page: Page) {
    super(page, page.getByTestId("active-draft-file-tabs"));

    this.tabList = this.root.getByRole("tablist");
    this.tabs = this.tabList.getByRole("tab");
    this.tabPanel = this.root.getByTestId("active-tab-panel");

    this.editTab = new ActiveDraftFileEditTab(page);
    this.runTab = new ActiveDraftFileRunTab(page);
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

  async expectToHaveActiveTabPanel() {
    await expect.soft(this.tabPanel).toBeVisible();
  }

  async expectNotToHaveActiveTabPanel() {
    await expect.soft(this.tabPanel).toBeHidden();
  }
}

export class ActiveDraftFileEditTab extends PageObject {
  readonly saveDraftButton: Locator;
  readonly revertChangesButton: Locator;
  readonly textarea: Locator;

  constructor(page: Page) {
    super(page, page.getByTestId("active-draft-file-edit-tab"));

    this.saveDraftButton = this.page.getByRole("button", {
      name: "Save Draft",
    });

    this.revertChangesButton = this.page.getByRole("button", {
      name: "Revert",
    });

    this.textarea = this.root.getByRole("textbox");
  }

  public async saveDraft() {
    await this.saveDraftButton.click();
  }

  public async revertChanges() {
    await this.revertChangesButton.click();
  }
}

export class ActiveDraftFileRunTab extends PageObject {
  readonly runRequestForm: RunRequestForm;

  constructor(page: Page) {
    super(page, page.getByTestId("active-draft-file-run-tab"));

    this.runRequestForm = new RunRequestForm(page);
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
  readonly activeDraftFile: ActiveDraftFile;

  constructor(page: Page) {
    super(page, page.getByTestId("open-request-file-tabs"));

    this.tabList = this.root.getByRole("tablist");
    this.tabs = this.tabList.getByRole("tab");
    this.tabPanel = this.root.getByTestId("active-tab-panel");
    this.activeRequestFile = new ActiveRequestFile(page);
    this.activeDraftFile = new ActiveDraftFile(page);
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

  async expectToHaveActiveTabPanel() {
    await expect.soft(this.tabPanel).toBeVisible();
  }

  async expectNotToHaveActiveTabPanel() {
    await expect.soft(this.tabPanel).toBeHidden();
  }

  async expectToHaveActiveRequestFile() {
    await expect.soft(this.activeRequestFile.getLocator()).toBeVisible();
  }

  async expectNotToHaveActiveRequestFile() {
    await expect.soft(this.activeRequestFile.getLocator()).toBeHidden();
  }

  async expectToHaveActiveDraftFile() {
    await expect.soft(this.activeDraftFile.getLocator()).toBeVisible();
  }

  async expectNotToHaveActiveDraftFile() {
    await expect.soft(this.activeDraftFile.getLocator()).toBeHidden();
  }

  closeTab(requestFile: string): Locator {
    return this.tabList.getByRole("button", {
      name: `Close ${requestFile}`,
    });
  }
}
