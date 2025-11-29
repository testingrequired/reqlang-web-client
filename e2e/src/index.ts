import { expect, Locator, Page } from "@playwright/test";

export class RootView {
  readonly root: Locator;
  readonly homeLink: Locator;
  readonly billsLink: Locator;
  readonly calendarLink: Locator;
  readonly transactionsLink: Locator;
  readonly debugLink: Locator;

  constructor(private readonly page: Page) {
    this.root = this.page.getByTestId("root");
    this.homeLink = this.root.getByRole("link", { name: "Home" });
    this.billsLink = this.root.getByRole("link", { name: "Bills" });
    this.calendarLink = this.root.getByRole("link", { name: "Calendar" });
    this.transactionsLink = this.root.getByRole("link", {
      name: "Transactions",
    });
    this.debugLink = this.root.getByRole("link", { name: "Debug" });
  }

  public async goto(): Promise<RootView> {
    await this.page.goto("/");

    await this.page.waitForURL(`/`);

    await expect(this.root).toBeVisible();

    return this;
  }

  public async gotoData(): Promise<DataView> {
    await this.dataLink.click();

    await this.page.waitForURL(`/#/data`);

    return new DataView(this.page);
  }
}

export class DataView {
  readonly root: Locator;
  readonly addNewValueLink: Locator;
  readonly addSecretValueLink: Locator;
  readonly keysTable: Locator;

  constructor(private readonly page: Page) {
    this.root = this.page.getByTestId("data");
    this.keysTable = this.root.getByTestId("keys-table");

    this.addNewValueLink = this.root.getByRole("link", {
      name: "Add New Value",
      exact: true,
    });

    this.addSecretValueLink = this.root.getByRole("link", {
      name: "Add New Secret",
      exact: true,
    });
  }

  public async gotoValueByKey(key: string): Promise<DataByKeyValueView> {
    await this.keysTable
      .getByRole("link", {
        name: key,
        exact: true,
      })
      .click();

    await this.page.waitForURL(`/#/data/key/${key}`);

    return new DataByKeyValueView(key, this.page);
  }

  public async gotoSecretByKey(key: string): Promise<DataByKeyValueSecretView> {
    await this.keysTable
      .getByRole("link", {
        name: `${key} 🔒`,
        exact: true,
      })
      .click();

    await this.page.waitForURL(`/#/data/key/${key}`);

    return new DataByKeyValueSecretView(key, this.page);
  }

  public async gotoAddNewValue(): Promise<AddNewValueView> {
    await this.addNewValueLink.click();

    await this.page.waitForURL("/#/data/new");

    return new AddNewValueView(this.page);
  }

  public async gotoAddNewSecret(): Promise<AddNewSecretView> {
    await this.addSecretValueLink.click();

    await this.page.waitForURL("/#/data/new_secret");

    return new AddNewSecretView(this.page);
  }
}

export class DataKeysTableView {
  readonly root: Locator;
  readonly keyLinks: Locator;

  constructor(private readonly page: Page) {
    this.root = page.getByTestId("keys-table");
    this.keyLinks = this.root.getByRole("link");
  }
}

export class DataByKeyValueView {
  readonly root: Locator;
  readonly keyText: Locator;
  readonly schemaText: Locator;
  readonly valueText: Locator;
  readonly editButton: Locator;
  readonly deleteButton: Locator;

  constructor(readonly key: string, private readonly page: Page) {
    this.root = page.getByTestId("data-view");

    this.keyText = this.root.getByTestId("key");
    this.schemaText = this.root.getByTestId("schema");
    this.valueText = this.root.getByTestId("value");

    this.editButton = this.root.getByText("Edit");
    this.deleteButton = this.root.getByText("Delete");
  }

  public async gotoEdit(): Promise<EditView> {
    await this.editButton.click();

    await this.page.waitForURL(`/#/data/key/${this.key}/edit`);

    return new EditView(this.key, this.page);
  }
}

export class DataByKeyValueSecretView {
  readonly root: Locator;
  readonly keyText: Locator;
  readonly schemaText: Locator;
  readonly valueText: Locator;
  readonly deleteButton: Locator;
  readonly revealSecretButton: Locator;
  readonly hideSecretButton: Locator;

  constructor(readonly key: string, private readonly page: Page) {
    this.root = page.getByTestId("data-view");

    this.keyText = this.root.getByTestId("key");
    this.schemaText = this.root.getByTestId("schema");
    this.valueText = this.root.getByTestId("value");

    this.deleteButton = this.root.getByText("Delete");

    this.revealSecretButton = this.root.getByText("Reveal Secret");
    this.hideSecretButton = this.root.getByText("Hide Secret");
  }

  public async revealSecret(): Promise<this> {
    await this.revealSecretButton.click();

    return this;
  }

  public async hideSecret(): Promise<this> {
    await this.hideSecretButton.click();

    return this;
  }

  public async gotoEdit(): Promise<EditView> {
    await this.page.goto(`/#/data/key/${this.key}/edit`);

    await this.page.waitForURL(`/#/data/key/${this.key}/edit`);

    return new EditView(this.key, this.page);
  }
}

export class EditView {
  readonly root: Locator;
  readonly schemaInput: Locator;
  readonly valueInput: Locator;
  readonly saveButton: Locator;
  readonly warningTitle: Locator;
  readonly warningBody: Locator;

  constructor(readonly key: string, private readonly page: Page) {
    this.root = page.getByTestId("data-edit");
    this.schemaInput = this.root.getByLabel("Schema");
    this.valueInput = this.root.getByLabel("Value");
    this.saveButton = this.root.getByText("Save");

    this.warningTitle = this.root.getByText("Secrets can't be edited!");
    this.warningBody = this.root.getByText(
      "Please delete and re-add secret with the desired value."
    );
  }

  public async fillSchema(schema: string): Promise<this> {
    await this.schemaInput.fill(schema);
    return this;
  }

  public async expectSchema(schema: string): Promise<void> {
    await expect(this.schemaInput).toHaveValue(schema);
  }

  public async fillValue(value: string): Promise<this> {
    await this.valueInput.fill(value);
    return this;
  }

  public async expectValue(value: string): Promise<void> {
    await expect(this.valueInput).toHaveValue(value);
  }

  public async fill(schema: string, value: string): Promise<this> {
    await this.fillSchema(schema);
    await this.fillValue(value);
    return this;
  }

  public async save(): Promise<DataByKeyValueView> {
    await this.saveButton.click();
    await this.page.waitForURL(`/#/data/key/${this.key}`);

    return new DataByKeyValueView(this.key, this.page);
  }
}

export class AddNewValueView {
  readonly root: Locator;
  readonly keyInput: Locator;
  readonly schemaInput: Locator;
  readonly valueInput: Locator;
  readonly saveButton: Locator;

  constructor(private readonly page: Page) {
    this.root = page.getByTestId("data-new-value");

    this.keyInput = this.root.getByLabel("Key");
    this.schemaInput = this.root.getByLabel("Schema");
    this.valueInput = this.root.getByLabel("Value");
    this.saveButton = this.root.getByText("Save");
  }

  public async fillKey(key: string): Promise<AddNewValueView> {
    await this.keyInput.fill(key);
    return this;
  }

  public async fillSchema(schema: string): Promise<AddNewValueView> {
    await this.schemaInput.fill(schema);
    return this;
  }

  public async expectSchema(schema: string): Promise<void> {
    await expect(this.schemaInput).toHaveValue(schema);
  }

  public async fillValue(value: string): Promise<AddNewValueView> {
    await this.valueInput.fill(value);
    return this;
  }

  public async fill(
    key: string,
    schema: string,
    value: string
  ): Promise<AddNewValueView> {
    await this.fillKey(key);
    await this.fillSchema(schema);
    await this.fillValue(value);
    return this;
  }

  public async save(): Promise<DataByKeyValueView> {
    const key = await this.keyInput.inputValue();

    await this.saveButton.click();
    await this.page.waitForURL(`/#/data/key/${key}`);

    return new DataByKeyValueView(key, this.page);
  }
}

export class AddNewSecretView {
  readonly root: Locator;
  readonly keyInput: Locator;
  readonly schemaInput: Locator;
  readonly valueInput: Locator;
  readonly saveButton: Locator;

  constructor(private readonly page: Page) {
    this.root = page.getByTestId("data-new-secret");

    this.keyInput = this.root.getByLabel("Key");
    this.schemaInput = this.root.getByLabel("Schema");
    this.valueInput = this.root.getByLabel("Value");
    this.saveButton = this.root.getByText("Save");
  }

  public async fillKey(key: string): Promise<AddNewSecretView> {
    await this.keyInput.fill(key);
    return this;
  }

  public async fillSchema(schema: string): Promise<AddNewSecretView> {
    await this.schemaInput.fill(schema);
    return this;
  }

  public async expectSchema(schema: string): Promise<void> {
    await expect(this.schemaInput).toHaveValue(schema);
  }

  public async fillValue(value: string): Promise<AddNewSecretView> {
    await this.valueInput.fill(value);
    return this;
  }

  public async fill(
    key: string,
    schema: string,
    value: string
  ): Promise<AddNewSecretView> {
    await this.fillKey(key);
    await this.fillSchema(schema);
    await this.fillValue(value);
    return this;
  }

  public async save(): Promise<DataByKeyValueSecretView> {
    const key = await this.keyInput.inputValue();

    await this.saveButton.click();
    await this.page.waitForURL(`/#/data/key/${key}`);

    return new DataByKeyValueSecretView(key, this.page);
  }
}
