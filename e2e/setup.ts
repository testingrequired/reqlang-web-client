import fs from "fs";
import path from "path";

export default function () {
  copy_test_requests_to_temp_directory();
}

function copy_test_requests_to_temp_directory() {
  const reqlangProjectDir = process.env.REQLANG_PROJECT_DIR;
  const e2eDir = process.cwd();
  const requestsDir = path.join(e2eDir, "..", "requests");

  fs.mkdir(reqlangProjectDir, (err: unknown) => {
    if (err) {
      console.error(`Unable to create ${reqlangProjectDir}: ${err}`);
    }

    fs.cp(
      requestsDir,
      reqlangProjectDir,
      {
        recursive: true,
      },
      (err: unknown) => {
        if (err) {
          console.error(
            `Unable to copy ${requestsDir} to ${reqlangProjectDir}: ${err}`
          );
        }
      }
    );
  });
}
