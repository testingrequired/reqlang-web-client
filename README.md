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
3. `cd` in to your project's root directory
4. Create a `.env` file in the project's root directory and [define an encryption key](#define-the-encryption-key).
5. Run `reqlang-web` from a terminal in a project directory containing request files

## Database Encryption

An encryption key must be defined before starting the app. This will be used to encrypt the app's database. Requests that references secrets will have secret values in the run history. Encryption helps ensure those values stay safe.

### Define The Encryption Key

Create a `.env` file at the root of your project directory, where `reqlang-web` will be ran, then define the `RQL_DB_KEY` environment variable.

```shell
RQL_DB_KEY=strongPassword1!
```

Be sure to also add `.env` to your source control ignore list (e.g. `.gitignore`). You don't want to commit this file.

### Changing The Encryption Key

The `RQL_DB_REKEY` environment variable is used when you'd like to change the database's encryption key. The `RQL_DB_KEY` environment variable is still required.

```shell
RQL_DB_KEY=strongPassword1!

RQL_DB_REKEY=strongPassword2@
```

## Development

See [DEVELOPMENT.md](./DEVELOPMENT.md) for details.
