# Next.js e2e

A minimal Next.js App Router app set up like the [SSR guide](https://www.unistyl.es/v3/guides/server-side-rendering):
`unistyles.ts` configures the `StyleSheet`, `Style.tsx` injects the server styles, and the root layout, a server
component, imports `../unistyles`.

```sh
bun e2e/nextjs/run.ts
```

The script packs `packages/unistyles` (which runs its build), installs the tarball into a copy of this app in a temp
directory, runs `next build`, starts the server and checks that `/` returns 200 with the rendered text and the
`unistyles-web` style tag. It exits non-zero on any failure.

The app lives outside the bun workspaces on purpose. Next.js only applies its React Server Components checks to app
code, so a workspace link would treat the library as app source and fail on hook imports that never reach users.
Installing the packed tarball tests the published artifact the way apps consume it.

`KEEP_E2E_DIR=1` keeps the temp directory for debugging, `PORT` changes the port (default 3123).
