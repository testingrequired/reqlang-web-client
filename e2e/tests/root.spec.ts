import { test, expect } from "@playwright/test";
import { REQLANG_PROJECT_DIR } from "@/test";
import { HomeView, RequestsView, RootView } from "@/test/page_objects";

const { beforeEach, describe } = test;

let root: RootView;

beforeEach(async ({ page }) => {
  root = new RootView(page);

  await root.goto();
});

test("has title", async ({ page }) => {
  await expect(page).toHaveTitle("reqlang-web");
});

describe("Root", () => {
  test("has home link", async ({ page }) => {
    await expect(root.homeLink).toBeVisible();
  });

  test("has request link", async ({ page }) => {
    await expect(root.requestLink).toBeVisible();
  });

  test("has run history link", async ({ page }) => {
    await expect(root.runHistoryLink).toBeVisible();
  });

  test("has debug link", async ({ page }) => {
    await expect(root.debugLink).toBeVisible();
  });
});

describe("Home", () => {
  let home: HomeView;

  beforeEach(async () => {
    home = await root.gotoHome();
  });

  test("has title", async ({ page }) => {
    await expect(page).toHaveTitle("reqlang-web");
  });

  test("has project cwd", async () => {
    await expect.soft(home.projectCwdText()).resolves.toBe(REQLANG_PROJECT_DIR);
    await expect
      .soft(home.projectCwdText())
      .resolves.not.toBe("{{join(cache_directory(), uuid())}}");
  });

  test("has alert that no requests have ran yet", async () => {
    await home.expectHasLatestRunsAlert();
  });

  test("has documentation links", async () => {
    await home.expectHasDocLinks({
      "testingrequired/reqlang": "https://github.com/testingrequired/reqlang",
      "testingrequired/reqlang-expr":
        "https://github.com/testingrequired/reqlang-expr",
      "HTTP messages - MDN":
        "https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Messages",
    });
  });
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

    test("does not have  close all files button", async () => {
      await requests.openRequestFilesForm.expectNotToHaveCloseAllButton();
    });

    describe("when click to open request file selector", () => {
      beforeEach(async () => {
        await requests.openRequestFilesForm.openFileSelectorButton.click();
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

        test("displays the open request file tab", async () => {
          await requests.openFileTabs.expectHasTab(expectedRequestFile);
        });

        test("displays the open request file tab panel", async () => {
          await requests.openFileTabs.expectTabPanelOpen();
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
