# Development Guide

This document provides guidance for developers looking to contribute to the `rust-backend-web-frontend` project. It outlines how to set up the project, build it, and run tests.

## Prerequisites

- [Rust](https://www.rust-lang.org/) (with support for clippy, rustfmt, and the stable toolchain)
- [Node.js](https://nodejs.org/) and npm
- [Just](https://github.com/casey/just), a command runner
- A \*nix like environment for commands like `parallel` and `watchexec`

## Project Structure

- **[types](./types/):** Shared types used by `server` and `client`
- **[client](./client/):** Frontend client that calls `server`.
- **[server](./server/):** Backend/API server for `client` served at `localhost:{port}/api`. It also statically serves `client` at `localhost:{port}/`.
- **[e2e](./e2e/):** End-to-end tests that run against the release build of the server/client.

## Setting Up

1. **Clone the Repository:**

   ```bash
   git clone https://github.com/your-repo/rust-backend-web-frontend.git
   cd rust-backend-web-frontend
   ```

2. **Install Node.js Dependencies for Client and Types:**

   ```bash
   cd client
   npm ci
   cd ../types
   npm ci
   ```

3. **Install Rust Dependencies:**

   You don't need to manually install dependencies for Rust; they're managed automatically when you build using Cargo.

4. **Update app name:**

   Edit the `app-name` variable in the root [justfile](./justfile). This controls the name of the binary using the `just install` command.

## Cleaning Up For Use As A Project Template

See [USING_AS_A_TEMPLATE.md](./USING_AS_A_TEMPLATE.md) for more details on how to clean up the project for use as a template.

## Building the Project

To build the project, use Justfile commands:

- **Build the entire project:**

  ```bash
  just build
  ```

- **Build for release:**

  This optimizes the build for production.

  ```bash
  just build-release
  ```

## Running the Project

- **Start the app in development mode:**

  ```bash
  just watch
  ```

  This will watch for changes and rebuild the types, server, and client automatically.

- **Run the app in production mode:**

  ```bash
  just install-release
  rust-web-app
  ```

## Testing

- **Run all tests:**

  ```bash
  just test
  ```

- **Run E2E tests:**

  This builds the app's binary, runs it, then runs a suite of Playwright tests against the running app. The app is then shut down after the tests are done.

  ```bash
  just e2e
  ```

## Linting and Formatting

- **Lint the code:**

  ```bash
  just lint
  ```

- **Automatically fix linting errors:**

  ```bash
  just lint-fix
  ```

- **Format the code:**
  ```bash
  just format
  ```

## Contributing

1. Fork the repository and clone your fork.
2. Create a feature branch from `main`.
3. Make your changes and commit them.
4. Push your branch and open a pull request against `main`.
