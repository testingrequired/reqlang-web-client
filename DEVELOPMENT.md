# Development

## Dependencies

- [rust](https://rustup.rs/)
- [just](https://just.systems/)
- [nvm](https://github.com/nvm-sh/nvm) or [nvm for windows](https://github.com/coreybutler/nvm-windows)/[node](https://nodejs.org/)
- [docker](https://www.docker.com/)

## Watch Mode

Running `just watch` will build the [types](./types/), [server](./server/), [client](./client/), and open the browser to http://localhost:3000. It will rebuild everything on change.

This also spins up the docker containers [kennethreitz/httpbin](https://hub.docker.com/r/kennethreitz/httpbin) and [ghcr.io/navikt/mock-oauth2-server](https://github.com/navikt/mock-oauth2-server/). These are used for some of the example reqlang files: [post.reqlang](./requests/post.reqlang), [auth2_openid_configuration.reqlang](./requests/auth2_openid_configuration.reqlang)
