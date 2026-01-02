import { test, expect } from "@playwright/test";
import { HomeView, REQLANG_PROJECT_DIR, RequestsView, RootView } from "@/test";

let root: RootView;

test.beforeEach(async ({ page }) => {
  root = new RootView(page);

  await root.goto();
});

test("has title", async ({ page }) => {
  await expect(page).toHaveTitle("reqlang-web");
});

test.describe("Root", () => {
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

test.describe("Home", () => {
  let home: HomeView;

  test.beforeEach(async () => {
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

test.describe("Requests", () => {
  let requests: RequestsView;

  test.beforeEach(async () => {
    requests = await root.gotoRequests();
  });

  test("has title", async ({ page }) => {
    await expect(page).toHaveTitle("reqlang-web");
  });

  test.describe("when no request files open", () => {
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

    test.describe("when click to open request file selector", () => {
      test.beforeEach(async () => {
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

      test.describe("when selected a request file", () => {
        test.beforeEach(async () => {
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

        test("displays the open request file", async () => {
          await expect(
            requests.requestFileTabByName("api_debug.reqlang")
          ).toBeVisible();
        });

        test.describe("when closing all files", () => {
          test.beforeEach(async () => {
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
              requests.requestFileTabByName("api_debug.reqlang")
            ).not.toBeVisible();
          });
        });
      });
    });
  });
});
