# Development

## Dependencies

- [rust](https://rustup.rs/)
- [just](https://just.systems/)
- [nvm](https://github.com/nvm-sh/nvm) or [nvm for windows](https://github.com/coreybutler/nvm-windows)/[node](https://nodejs.org/)
- [docker](https://www.docker.com/)

## Watch Mode

Running `just watch` will build the [types](./types/), [server](./server/), [client](./client/), and open the browser to http://localhost:3000. It will rebuild everything on change.

This also spins up the docker containers [kennethreitz/httpbin](https://hub.docker.com/r/kennethreitz/httpbin) and [ghcr.io/navikt/mock-oauth2-server](https://github.com/navikt/mock-oauth2-server/). These are used for some of the example reqlang files: [post.reqlang](./requests/post.reqlang), [auth2_openid_configuration.reqlang](./requests/auth2_openid_configuration.reqlang)

## Architecture

There are two binaries produced on build: `reqlang-web-browser` and `reqlang-web`.

### reqlang-web-browser

The `reqlang-web-browser` binary is the server and client. The server acts as the backend API and statically serves the built client. This is primarily used during development.

```mermaid
architecture-beta
    service client(internet)[Client]
    service server(server)[Server]

    server:R <--> L:client
```

### reqlang-web

The `reqlang-web` binary is the server and client wrapped in a native web view. This is primarily used when running as a standalone app.

```mermaid
architecture-beta
    service webView(server)[Web View]
    service client(internet)[Client]
    service server(server)[Server]

    server:R <--> L:client
    webView:R <-- L:server
```
