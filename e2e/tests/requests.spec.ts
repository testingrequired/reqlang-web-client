import { test, expect } from "@playwright/test";
import { RootView } from "@/test/page_objects";
import { RequestsView } from "../src/pom/request_page";

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

    test("has  new draft file button", async () => {
      await requests.openRequestFilesForm.expectToHaveNewDraftFileButton();
    });

    describe("when click to add new draft file", () => {
      beforeEach(async () => {
        await requests.openRequestFilesForm.addNewDraftFile();
      });

      test("has open files button", async () => {
        await requests.openRequestFilesForm.expectHasOpenFileSelectorButton();
      });

      test("has close all files button", async () => {
        await requests.openRequestFilesForm.expectHasCloseAllButton();
      });

      test("has new draft file button", async () => {
        await requests.openRequestFilesForm.expectToHaveNewDraftFileButton();
      });

      test("displays the open request file tabs", async () => {
        await requests.openFileTabs.expectToBeVisible();
      });

      test("displays the expected request file tab", async () => {
        await requests.openFileTabs.expectHasFileTabOpen("draft-");
      });

      test("displays the expected request file tab as active", async () => {
        await requests.openFileTabs.expectIsFileTabActive("draft-");
      });

      test("displays the open draft file tab panel", async () => {
        await requests.openFileTabs.expectToHaveActiveTabPanel();
        await requests.openFileTabs.expectToHaveActiveDraftFile();
        await requests.openFileTabs.activeDraftFile.expectToBeVisible();
      });

      test("displays the open draft file tabs", async () => {
        await requests.openFileTabs.activeDraftFile.tabs.expectToBeVisible();
      });

      test("displays the 'Edit' tab by default", async () => {
        await requests.openFileTabs.activeDraftFile.tabs.expectIsFileTabActive(
          "Edit",
        );

        await requests.openFileTabs.activeDraftFile.tabs.editTab.expectToBeVisible();
      });

      test("the 'Safe Draft' button on the Edit tab is disabled", async () => {
        await expect(
          requests.openFileTabs.activeDraftFile.tabs.editTab.saveDraftButton,
        ).toBeDisabled();
      });

      test("the 'Revert Changes' button on the Edit tab is disabled", async () => {
        await expect(
          requests.openFileTabs.activeDraftFile.tabs.editTab
            .revertChangesButton,
        ).toBeDisabled();
      });

      test("the run tab is enabled", async () => {
        await expect(
          requests.openFileTabs.activeDraftFile.tabs.getTabByName("Run"),
        ).toBeEnabled();
      });

      describe("when draft content is modified but not saved", () => {
        let originalValue: string;

        beforeEach(async () => {
          originalValue =
            await requests.openFileTabs.activeDraftFile.tabs.editTab.textarea.inputValue();

          await requests.openFileTabs.activeDraftFile.tabs.editTab.textarea.click();
          await requests.openFileTabs.activeDraftFile.tabs.editTab.textarea.fill(
            "```%request\nGET https://example.com?test=modified HTTP/1.1\n```",
          );
        });

        test("the draft has been modified", async () => {
          await expect(
            requests.openFileTabs.activeDraftFile.tabs.editTab.textarea.inputValue(),
          ).not.toBe(originalValue);
        });

        test("the 'Safe Draft' button on the Edit tab is enabled", async () => {
          await expect(
            requests.openFileTabs.activeDraftFile.tabs.editTab.saveDraftButton,
          ).toBeEnabled();
        });

        test("the 'Revert Changes' button on the Edit tab is enabled", async () => {
          await expect(
            requests.openFileTabs.activeDraftFile.tabs.editTab
              .revertChangesButton,
          ).toBeEnabled();
        });

        test("the run tab is disabled", async () => {
          await expect(
            requests.openFileTabs.activeDraftFile.tabs.getTabByName("Run"),
          ).toBeDisabled();
        });

        describe("when the save button is clicked", () => {
          beforeEach(async () => {
            await requests.openFileTabs.activeDraftFile.tabs.editTab.saveDraft();
          });

          test("the run tab is enabled", async () => {
            await expect(
              requests.openFileTabs.activeDraftFile.tabs.getTabByName("Run"),
            ).toBeEnabled();
          });

          describe("click on run tab", () => {
            beforeEach(async () => {
              await requests.openFileTabs.activeDraftFile.tabs
                .getTabByName("Run")
                .click();
            });

            test("displays the run request form", async () => {
              await requests.openFileTabs.activeDraftFile.tabs.runTab.expectToBeVisible();
              await requests.openFileTabs.activeDraftFile.tabs.runTab.runRequestForm.expectToBeVisible();
            });

            test("displays the modified draft request", async () => {
              await expect(
                requests.openFileTabs.activeDraftFile.requestBodyTemplate,
              ).toHaveText("GET https://example.com?test=modified HTTP/1.1");
            });
          });
        });

        describe("when the revert button is clicked", () => {
          beforeEach(async () => {
            await requests.openFileTabs.activeDraftFile.tabs.editTab.revertChanges();
          });

          test("the draft has not been modified", async () => {
            await expect(
              requests.openFileTabs.activeDraftFile.tabs.editTab.textarea,
            ).toHaveValue(originalValue);
          });

          test("the 'Safe Draft' button on the Edit tab is disabled", async () => {
            await expect(
              requests.openFileTabs.activeDraftFile.tabs.editTab
                .saveDraftButton,
            ).toBeDisabled();
          });

          test("the 'Revert Changes' button on the Edit tab is disabled", async () => {
            await expect(
              requests.openFileTabs.activeDraftFile.tabs.editTab
                .revertChangesButton,
            ).toBeDisabled();
          });
        });
      });

      describe("when click on run tab", () => {
        beforeEach(async () => {
          await requests.openFileTabs.activeDraftFile.tabs
            .getTabByName("Run")
            .click();
        });

        test("displays the run request form", async () => {
          await requests.openFileTabs.activeDraftFile.tabs.runTab.expectToBeVisible();
          await requests.openFileTabs.activeDraftFile.tabs.runTab.runRequestForm.expectToBeVisible();
        });

        describe("when running the request", () => {
          beforeEach(async () => {
            await requests.openFileTabs.activeDraftFile.tabs.runTab.runRequestForm.submitForm();
          });

          test("does not have the request body export", async () => {
            await requests.openFileTabs.activeDraftFile.tabs.runTab.runRequestForm.expectNoRequestBodyExport();
          });

          test("has the request body", async () => {
            await requests.openFileTabs.activeDraftFile.tabs.runTab.runRequestForm.expectHasRequestBody(
              "GET https://example.com HTTP/1.1",
            );
          });

          test("has the response body", async () => {
            await requests.openFileTabs.activeDraftFile.tabs.runTab.runRequestForm.expectHasResponseBody(
              "HTTP/1.1 200 OK\n",
            );
          });
        });
      });
    });

    describe("when click to open request file selector", () => {
      beforeEach(async () => {
        await requests.openRequestFilesForm.openFileSelector();
      });

      test("does not have open files button", async () => {
        await requests.openRequestFilesForm.expectNotToHaveOpenFileSelectorButton();
      });

      test("does not have close all files button", async () => {
        await requests.openRequestFilesForm.expectNotToHaveCloseAllButton();
      });

      test("does not have new draft file button", async () => {
        await requests.openRequestFilesForm.expectToNotHaveNewDraftFileButton();
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
            expectedRequestFile,
          );

          await requests.openRequestFilesForm.blur();
        });

        test("has open files button", async () => {
          await requests.openRequestFilesForm.expectHasOpenFileSelectorButton();
        });

        test("has close all files button", async () => {
          await requests.openRequestFilesForm.expectHasCloseAllButton();
        });

        test("has new draft file button", async () => {
          await requests.openRequestFilesForm.expectToHaveNewDraftFileButton();
        });

        test("displays the open request file tabs", async () => {
          await requests.openFileTabs.expectToBeVisible();
        });

        test("displays the expected request file tab", async () => {
          await requests.openFileTabs.expectHasFileTabOpen(expectedRequestFile);
        });

        test("displays the expected request file tab as active", async () => {
          await requests.openFileTabs.expectIsFileTabActive(
            expectedRequestFile,
          );
        });

        test("displays the open request file tab panel", async () => {
          await requests.openFileTabs.expectToHaveActiveTabPanel();
          await requests.openFileTabs.expectToHaveActiveRequestFile();
        });

        test("displays the expected request file's HTTP request", async () => {
          await requests.openFileTabs.activeRequestFile.expectToHaveRequestBodyTemplate(
            "GET {{@clientUrl}}/api/debug HTTP/1.1",
          );
        });

        describe("when exporting the request", () => {
          beforeEach(async () => {
            await requests.openFileTabs.activeRequestFile.runRequestForm.enableExportRequest();
            await requests.openFileTabs.activeRequestFile.runRequestForm.submitExportRequestForm();
          });

          test("has export format selected", async () => {
            await requests.openFileTabs.activeRequestFile.runRequestForm.expectToHaveExportFormatSelected(
              "http",
            );
          });

          test("has the request body export", async () => {
            await requests.openFileTabs.activeRequestFile.runRequestForm.expectRequestBodyExport(
              "GET http://[::1]:3123/api/debug HTTP/1.1",
            );
          });

          test("does not have the request body", async () => {
            await requests.openFileTabs.activeRequestFile.runRequestForm.expectNoRequestBody();
          });

          describe("when selecting curl format", () => {
            beforeEach(async () => {
              await requests.openFileTabs.activeRequestFile.runRequestForm.selectExportFormat(
                "curl",
              );

              await requests.openFileTabs.activeRequestFile.runRequestForm.submitExportRequestForm();
            });

            test("has curl export format selected", async () => {
              await requests.openFileTabs.activeRequestFile.runRequestForm.expectToHaveExportFormatSelected(
                "curl",
              );
            });

            test("has the request body export", async () => {
              await requests.openFileTabs.activeRequestFile.runRequestForm.expectRequestBodyExport(
                "curl http://[::1]:3123/api/debug --http1.1 -v",
              );
            });

            describe("when disable exporting then reenabling exporting", () => {
              beforeEach(async () => {
                await requests.openFileTabs.activeRequestFile.runRequestForm.disableExportRequest();
                await requests.openFileTabs.activeRequestFile.runRequestForm.enableExportRequest();
              });

              test("has http export format selected", async () => {
                await requests.openFileTabs.activeRequestFile.runRequestForm.expectToHaveExportFormatSelected(
                  "http",
                );
              });
            });
          });
        });

        describe("when running the request", () => {
          beforeEach(async () => {
            await requests.openFileTabs.activeRequestFile.runRequestForm.submitForm();
          });

          test("does not have the request body export", async () => {
            await requests.openFileTabs.activeRequestFile.runRequestForm.expectNoRequestBodyExport();
          });

          test("has the request body", async () => {
            await requests.openFileTabs.activeRequestFile.runRequestForm.expectHasRequestBody(
              "GET http://[::1]:3123/api/debug HTTP/1.1",
            );
          });

          test("has the response body", async () => {
            await requests.openFileTabs.activeRequestFile.runRequestForm.expectHasResponseBody(
              "HTTP/1.1 200 OK\ncontent-type: application/json\nvary: accept-encoding\ncontent-length: 151",
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
