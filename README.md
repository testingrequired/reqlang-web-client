# reqlang-web

[![build-artifacts](https://github.com/testingrequired/reqlang-web-client/actions/workflows/build-artifacts.yml/badge.svg)](https://github.com/testingrequired/reqlang-web-client/actions/workflows/build-artifacts.yml)

A single binary webview executable REST client for [reqlang](https://github.com/testingrequired/reqlang).

![Screenshot of the home dashboard](./screenshot-home-dashboard.png)

![Screenshot of running a request](./screenshot-run-request0.png)

![Screenshot of running a second request](./screenshot-run-request1.png)

![Screenshot of the run history](./screenshot-run-history.png)

## Usage

1. [Download](https://github.com/testingrequired/reqlang-web-client/actions/workflows/build-artifacts.yml)
2. Unzip the `reqlang-web` in a directory on the `PATH`
3. Optional/Recommended: Set environment variable `REQLANG_DB_ENCRYPTION_KEY`. This encrypts application's sqlite database
4. Run `reqlang-web` from a terminal in a project directory containing request files

## Development

See [DEVELOPMENT.md](./DEVELOPMENT.md) for details.
