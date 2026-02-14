import { expect, Locator, Page } from "@playwright/test";
import { PageObject } from "..";
import { HttpRequest, HttpResponse, ParsedConfig } from "reqlang-types";

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

export class ParseResultIndicator extends PageObject {
  readonly loadingIcon: Locator;
  readonly successIcon: Locator;
  readonly failureIcon: Locator;

  constructor(page: Page) {
    super(page, page.getByTestId("parse-result-indicator"));

    this.loadingIcon = this.root.getByTestId("parse-result-indicator-loading");
    this.successIcon = this.root.getByTestId("parse-result-indicator-success");
    this.failureIcon = this.root.getByTestId("parse-result-indicator-failure");
  }

  public async expectIsLoading() {
    await this.loadingIcon.scrollIntoViewIfNeeded();
    await expect(this.loadingIcon).toBeVisible();
  }

  public async expectIsShowingAsError() {
    await this.failureIcon.scrollIntoViewIfNeeded();
    await expect(this.failureIcon).toBeVisible();
  }

  public async expectIsShowingAsSuccess() {
    await this.successIcon.scrollIntoViewIfNeeded();
    await expect(this.successIcon).toBeVisible();
  }
}

export class ActiveDraftFileTabs extends PageObject {
  readonly tabList: Locator;
  readonly tabs: Locator;
  readonly tabPanel: Locator;
  readonly editTab: ActiveDraftFileEditTab;
  readonly runTab: ActiveDraftFileRunTab;
  readonly parseResultIndicator: ParseResultIndicator;

  constructor(page: Page) {
    super(page, page.getByTestId("active-draft-file-tabs"));

    this.tabList = this.root.getByRole("tablist");
    this.tabs = this.tabList.getByRole("tab");
    this.tabPanel = this.root.getByTestId("active-tab-panel");

    this.editTab = new ActiveDraftFileEditTab(page);
    this.runTab = new ActiveDraftFileRunTab(page);

    this.parseResultIndicator = new ParseResultIndicator(page);
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

class SaveToFileModal extends PageObject {
  readonly filenameInput: Locator;
  readonly saveButton: Locator;

  constructor(page: Page) {
    super(
      page,
      page.getByRole("dialog", {
        name: "Save To File",
      }),
    );

    this.filenameInput = this.root.getByPlaceholder(
      "path/to/save/request.reqlang",
    );

    this.saveButton = this.root.getByRole("button", {
      name: "Save",
    });
  }
}

export class ActiveDraftFileEditTab extends PageObject {
  readonly saveDraftButton: Locator;
  readonly revertChangesButton: Locator;
  readonly saveToFileButton: Locator;
  readonly saveToFileModal: SaveToFileModal;
  readonly httpRequestForm: HttpRequestForm;
  readonly httpResponseForm: HttpResponseForm;
  readonly configForm: ConfigForm;
  readonly addResponseAssertionButton: Locator;
  readonly removeResponseAssertionButton: Locator;

  constructor(page: Page) {
    super(page, page.getByTestId("active-draft-file-edit-tab"));

    this.saveDraftButton = this.page.getByRole("button", {
      name: "Save Draft",
    });

    this.revertChangesButton = this.page.getByRole("button", {
      name: "Revert",
    });

    this.saveToFileButton = this.page.getByRole("button", {
      name: "Save To File",
    });

    this.saveToFileModal = new SaveToFileModal(page);

    this.httpRequestForm = new HttpRequestForm(page);
    this.httpResponseForm = new HttpResponseForm(page);
    this.configForm = new ConfigForm(page);
    this.addResponseAssertionButton = page.getByRole("button", {
      name: "Add Response Assertion",
    });

    this.removeResponseAssertionButton = page.getByRole("button", {
      name: "Remove Response Assertion",
    });
  }

  public async saveDraft() {
    await this.saveDraftButton.click();
  }

  public async revertChanges() {
    await this.revertChangesButton.click();
  }

  public async saveToFile(filePathToSaveAs: string) {
    await this.saveToFileButton.click();
    await this.saveToFileModal.expectToBeVisible();
    await this.saveToFileModal.filenameInput.fill(filePathToSaveAs);
    await this.saveToFileModal.saveButton.click();
  }
}

export class HttpRequestForm extends PageObject {
  readonly method: Locator;
  readonly url: Locator;
  readonly httpVersion: Locator;
  readonly addHeaderButton: Locator;
  readonly body: Locator;
  readonly headers: Locator;

  constructor(page: Page) {
    super(page, page.getByTestId("edit-http-request-form"));

    this.method = page.getByRole("textbox", { name: "Method" });
    this.url = page.getByRole("textbox", {
      name: "URL",
    });
    this.httpVersion = page.getByRole("textbox", { name: "HTTP Version" });
    this.headers = page.getByTestId("request-header");
    this.body = page.getByRole("textbox", {
      name: "Body",
    });
  }

  public async fillFromRequest(request: HttpRequest) {
    await this.url.clear();
    await this.url.fill(request.target);
  }

  public async expectRequestIs(expected: HttpRequest) {
    await expect.soft(this.method).toHaveValue(expected.verb);
    await expect.soft(this.url).toHaveValue(expected.target);
    await expect.soft(this.httpVersion).toHaveValue(expected.http_version);

    for (const [
      expected_header_key,
      expected_header_value,
    ] of expected.headers) {
      await expect
        .soft(this.getHeaderByKey(expected_header_key))
        .resolves.toBe(expected_header_value);
    }

    if (expected.body !== null) {
      await expect.soft(this.body).toHaveValue(expected.body);
    }
  }

  async getHeaderByKey(key: string): Promise<string> {
    return this.headers
      .filter({
        hasText: key,
      })
      .getByTestId("request-header-value")
      .textContent();
  }
}

export class HttpResponseForm extends PageObject {
  readonly httpVersion: Locator;
  readonly statusCode: Locator;
  readonly statusText: Locator;
  readonly addHeaderButton: Locator;
  readonly headers: Locator;
  readonly body: Locator;

  constructor(page: Page) {
    super(page, page.getByTestId("edit-http-response-form"));

    this.httpVersion = page.getByRole("textbox", { name: "HTTP Version" });

    this.headers = page.getByTestId("response-header");

    this.body = page.getByRole("textbox", {
      name: "Body",
    });
  }

  public async fillFromResponse(response: HttpResponse) {
    await this.body.clear();
    await this.body.fill(response.body);
  }

  public async expectRequestIs(expected: HttpResponse) {
    await expect.soft(this.httpVersion).toHaveValue(expected.http_version);

    for (const [
      expected_header_key,
      expected_header_value,
    ] of expected.headers) {
      await expect
        .soft(this.getHeaderByKey(expected_header_key))
        .resolves.toBe(expected_header_value);
    }

    if (expected.body !== null) {
      await expect.soft(this.body).toHaveValue(expected.body);
    }
  }

  async getHeaderByKey(key: string): Promise<string> {
    return this.headers
      .filter({
        hasText: key,
      })
      .getByTestId("request-header-value")
      .textContent();
  }
}

export class ConfigForm extends PageObject {
  readonly secretsInput: Locator;
  readonly envsInput: Locator;
  readonly addVariableButton: Locator;
  readonly vars: Locator;
  readonly addPromptButton: Locator;
  readonly promptNameInput: Locator;

  constructor(page: Page) {
    super(page, page.getByTestId("edit-config-form"));

    this.secretsInput = this.root.getByTestId("config-secrets");
    this.envsInput = this.page.getByTestId("config-env-names");
    this.addVariableButton = this.root.getByRole("button", {
      name: "Add variable",
    });
    this.vars = this.root.getByTestId("variable");
    this.addPromptButton = this.root.getByRole("button", {
      name: "Add prompt",
    });
    this.promptNameInput = this.root.getByTestId("prompt-name").last();
  }

  public async fillFromConfig(config: Partial<ParsedConfig>) {
    for (const secret of config.secrets ?? []) {
      await this.addSecret(secret);
    }

    for (const prompt of config.prompts ?? []) {
      await this.addPrompt(prompt.name);
    }

    for (const env of Object.keys(config.envs ?? {})) {
      await this.addEnv(env);
    }

    for (const variable of config.vars ?? []) {
      await this.addVariable(variable.name, variable.default);
    }

    for (const env of Object.keys(config.envs ?? {})) {
      const envVars = config.envs[env] ?? {};

      for (const [key, value] of Object.entries(envVars)) {
        await this.addEnvVariable(env, key, value);
      }
    }
  }

  public async addSecret(secretName: string) {
    await this.secretsInput.fill(secretName);
    await this.page.keyboard.press("Enter");
  }

  public async addPrompt(promptName: string) {
    await this.addPromptButton.click();
    await this.promptNameInput.fill(promptName);
  }

  public async addEnv(envName: string) {
    await this.envsInput.fill(envName);
    await this.page.keyboard.press("Enter");
  }

  public async addVariable(variableName: string, defaultValue?: string) {
    await this.addVariableButton.scrollIntoViewIfNeeded();
    await this.addVariableButton.click();
    const last = this.vars.last();

    await last.getByTestId("variable-name").fill(variableName);

    if (defaultValue) {
      await last.getByTestId("variable-default-value").fill(defaultValue);
    }
  }

  public async addEnvVariable(
    envName: string,
    variableName: string,
    value: string,
  ) {
    await this.getEnvVariableValueInput(envName, variableName).fill(value);
  }

  public getVariableValueTextValue(
    envName: string,
    variableName: string,
  ): Promise<string> {
    return this.getEnvVariableValueInput(envName, variableName).textContent();
  }

  private getEnvVariableValueInput(
    envName: string,
    variableName: string,
  ): Locator {
    return this.page.getByTestId(
      `env-${envName}-variable-value-${variableName}`,
    );
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

  async expectNotToHaveFileTabOpen(requestFile: string) {
    await expect(this.getTabByName(requestFile)).not.toBeVisible();
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
