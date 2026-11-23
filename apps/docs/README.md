# Unistyles documentation (v3)

Static Astro + Starlight site for [unistyl.es](https://unistyl.es).

## Local development

```bash
# from monorepo root
bun install
bun run --cwd apps/docs dev
```

```bash
bun run --cwd apps/docs build   # output: apps/docs/dist
bun run --cwd apps/docs preview
```

## Redirects

Legacy Unistyles 2.0 paths (`/start/*`, `/reference/*`, `/other/*`, `/examples/*`) redirect to [v2.unistyl.es](https://v2.unistyl.es).

- **Production (Cloudflare Pages):** `public/_redirects` → real HTTP 301s
- **Astro config:** `redirects` in `astro.config.mjs` → HTML meta-refresh for local preview

## Cloudflare Pages (v3)

Deployed by Cloudflare Pages **Git integration** (not GitHub Actions).

| Setting | Value |
|---------|--------|
| Project name | `unistyles-docs` |
| Production branch | `main` |
| Root directory | `apps/docs` (or monorepo root — match dashboard) |
| Build command | `npm run build` / `bun run build` (as configured in CF) |
| Output | `dist` |
| Custom domains | `unistyl.es`, `www.unistyl.es` |

### Environment variables

**None required.** The site is fully static:

- `site` is hardcoded in `astro.config.mjs` (`https://unistyl.es/v3/`)
- Analytics is the self-hosted Unilitics tracker (`/_a/s.js`), served by a Cloudflare Worker route, so it needs no config here
- No API keys, secrets, or `import.meta.env` usage

Optional build-only vars in the CF dashboard (not app secrets):

| Name | Value | Why |
|------|--------|-----|
| `NODE_VERSION` | `20` | Match monorepo `engines` |

Auth for deploys is the **GitHub ↔ Cloudflare** connection. You do **not** need `CLOUDFLARE_API_TOKEN` in GitHub for this path.

Manual override (rare):

```bash
bun run --cwd apps/docs build
npx wrangler@latest pages deploy apps/docs/dist \
  --project-name unistyles-docs \
  --branch main
```

## Cloudflare Pages (v2 archive)

Frozen docs for Unistyles 2.0 live on branch `docs/v2` (pre-monorepo layout under `docs/`).

| Setting | Value |
|---------|--------|
| Project name | `unistyles-docs-v2` |
| Production branch | `docs/v2` |
| Root directory | `docs` |
| Build command | `npm install --workspaces=false && npm run build` |
| Build output directory | `dist` |
| Node.js version | `20` |
| Custom domain | `v2.unistyl.es` |

Treat `docs/v2` as archival — do not merge main into it.
