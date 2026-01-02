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
    await expect(home.latestRunsAlert).toBeVisible();
  });

  test("has documentation links", async () => {
    await expect
      .soft(home.doclinks)
      .toHaveText([
        "testingrequired/reqlang",
        "testingrequired/reqlang-expr",
        "HTTP messages - MDN",
      ]);

    await expect
      .soft(home.docLinkUrls())
      .resolves.toStrictEqual([
        "https://github.com/testingrequired/reqlang",
        "https://github.com/testingrequired/reqlang-expr",
        "https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Messages",
      ]);
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
      await expect(
        requests.openRequestFilesForm.openFileSelectorButton
      ).toBeVisible();
    });

    test("does not have  close all files button", async () => {
      await expect(
        requests.openRequestFilesForm.closeAllButton
      ).not.toBeVisible();
    });

    describe("when click to open request file selector", () => {
      beforeEach(async () => {
        await requests.openRequestFilesForm.openFileSelectorButton.click();
      });

      test("does not have open files button", async () => {
        await expect(
          requests.openRequestFilesForm.openFileSelectorButton
        ).not.toBeVisible();
      });

      test("does not have  close all files button", async () => {
        await expect(
          requests.openRequestFilesForm.closeAllButton
        ).not.toBeVisible();
      });

      test("has request file selector textbox", async () => {
        await expect(requests.openRequestFilesForm.selectTextbox).toBeVisible();
      });

      test("has request file selector options", async () => {
        await expect(requests.openRequestFilesForm.selectOptions).toHaveText([
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
        beforeEach(async () => {
          await requests.openRequestFilesForm.selectRequestFile(
            "api_debug.reqlang"
          );

          await requests.openRequestFilesForm.blur();
        });

        test("has open files button", async () => {
          await expect(
            requests.openRequestFilesForm.openFileSelectorButton
          ).toBeVisible();
        });

        test("has close all files button", async () => {
          await expect(
            requests.openRequestFilesForm.closeAllButton
          ).toBeVisible();
        });

        test("displays the open request file tabs", async () => {
          await expect(requests.openFileTabs.getLocator()).toBeVisible();
        });

        test("displays the open request file tab", async () => {
          await expect(
            requests.openFileTabs.getTab("api_debug.reqlang")
          ).toBeVisible();
        });

        test("displays the open request file tab panel", async () => {
          await expect(requests.openFileTabs.tabPanel).toBeVisible();
        });

        describe("when closing all files", () => {
          beforeEach(async () => {
            await requests.openRequestFilesForm.closeAllButton.click();
          });

          test("has open files button", async () => {
            await expect(
              requests.openRequestFilesForm.openFileSelectorButton
            ).toBeVisible();
          });

          test("does not have close all files button", async () => {
            await expect(
              requests.openRequestFilesForm.closeAllButton
            ).not.toBeVisible();
          });

          test("does not display the open request files", async () => {
            await expect(
              requests.openFileTabs.getTab("api_debug.reqlang")
            ).not.toBeVisible();
          });
        });
      });
    });
  });
});
