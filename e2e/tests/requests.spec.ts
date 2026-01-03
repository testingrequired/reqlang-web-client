import { test, expect } from "@playwright/test";
import { RequestsView, RootView } from "@/test/page_objects";

const { beforeEach, describe } = test;

let root: RootView;

beforeEach(async ({ page }) => {
  root = new RootView(page);

  await root.goto();
});

describe("Requests", () => {
  let requests: RequestsView;

  beforeEach(async () => {
    requests = await root.gotoRequests();
  });

  test("has title", async ({ page }) => {
    await expect(page).toHaveTitle("reqlang-web");
  });

  describe("when no request files open", () => {
    test("has open files button", async () => {
      await requests.openRequestFilesForm.expectHasOpenFileSelectorButton();
    });

    test("does not have close all files button", async () => {
      await requests.openRequestFilesForm.expectNotToHaveCloseAllButton();
    });

    describe("when click to open request file selector", () => {
      beforeEach(async () => {
        await requests.openRequestFilesForm.openFileSelector();
      });

      test("does not have open files button", async () => {
        await requests.openRequestFilesForm.expectNotToHaveOpenFileSelectorButton();
      });

      test("does not have  close all files button", async () => {
        await requests.openRequestFilesForm.expectNotToHaveCloseAllButton();
      });

      test("has request file selector textbox", async () => {
        await requests.openRequestFilesForm.expectToHaveTextbox();
      });

      test("has request file selector options", async () => {
        await requests.openRequestFilesForm.expectToHaveSelectOptions([
          "api_debug.reqlang",
          "api_file.reqlang",
          "api_files.reqlang",
          "api_run_history.reqlang",
          "auth2_openid_configuration.reqlang",
          "auth2_token_client_credentials.reqlang",
          "auth2_token_password.reqlang",
          "auth2_userinfo.reqlang",
          "form.reqlang",
          "post.reqlang",
          "status_code.reqlang",
        ]);
      });

      describe("when selected a request file", () => {
        const expectedRequestFile = "api_debug.reqlang";

        beforeEach(async () => {
          await requests.openRequestFilesForm.selectRequestFile(
            expectedRequestFile
          );

          await requests.openRequestFilesForm.blur();
        });

        test("has open files button", async () => {
          await requests.openRequestFilesForm.expectHasOpenFileSelectorButton();
        });

        test("has close all files button", async () => {
          await requests.openRequestFilesForm.expectHasCloseAllButton();
        });

        test("displays the open request file tabs", async () => {
          await requests.openFileTabs.expectToBeVisible();
        });

        test("displays the expected request file tab", async () => {
          await requests.openFileTabs.expectHasFileTabOpen(expectedRequestFile);
        });

        test("displays the expected request file tab as active", async () => {
          await requests.openFileTabs.expectIsFileTabActive(
            expectedRequestFile
          );
        });

        test("displays the open request file tab panel", async () => {
          await requests.openFileTabs.expectHasActiveRequestTabContents();
        });

        test("displays the expected request file's HTTP request", async () => {
          await requests.openFileTabs.activeRequestFile.expectToHaveRequestBodyTemplate(
            "GET {{@clientUrl}}/api/debug HTTP/1.1"
          );
        });

        describe("when previewing the request", () => {
          beforeEach(async () => {
            await requests.openFileTabs.activeRequestFile.runRequestForm.enablePreviewRequest();
          });

          test("has the request body preview", async () => {
            await requests.openFileTabs.activeRequestFile.runRequestForm.submitForm();
            await requests.openFileTabs.activeRequestFile.runRequestForm.expectRequestBodyPreview(
              "GET http://[::1]:3123/api/debug HTTP/1.1"
            );
          });
        });

        describe("when closing single file", () => {
          beforeEach(async () => {
            await requests.openFileTabs.closeTab(expectedRequestFile).click();
          });

          test("has open files button", async () => {
            await requests.openRequestFilesForm.expectHasOpenFileSelectorButton();
          });

          test("does not have close all files button", async () => {
            await requests.openRequestFilesForm.expectNotToHaveCloseAllButton();
          });

          test("does not display the open request files", async () => {
            await requests.openFileTabs.expectNotHaveTab(expectedRequestFile);
          });
        });

        describe("when closing all files", () => {
          beforeEach(async () => {
            await requests.openRequestFilesForm.closeAllButton.click();
          });

          test("has open files button", async () => {
            await requests.openRequestFilesForm.expectHasOpenFileSelectorButton();
          });

          test("does not have close all files button", async () => {
            await requests.openRequestFilesForm.expectNotToHaveCloseAllButton();
          });

          test("does not display the open request files", async () => {
            await requests.openFileTabs.expectNotHaveTab(expectedRequestFile);
          });
        });
      });
    });
  });
});
