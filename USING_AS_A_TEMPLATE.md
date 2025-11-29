# Using Repo As A Template

If you plan on using this repo as a template for creating an app, here are some spots you'll need to modify.

## LICENSE

Update the existing [LICENSE](./LICENSE) file with your name/copyright if you're releasing it under the MIT license. Or add your own license while keeping the original license intact.

## Client

The [client](./client/) is current a React app build using Vite. The build outputs to `../server/static` so that server can package it in to it's built binary.

The contents of the client directory can be completely replaced as long as it outputs it's build to `../server/static`.

## Types

The shared [types](./types/) are fully generated so won't require updates.

## Server

Cleaning up is primarily cleaning up [./server/src/main.rs](./server/src/main.rs).
