# Sportsbet Studio App Store

A federated internal App Store that aggregates apps from multiple GitHub repositories into a single registry, CLI, and web storefront.

## Architecture

```
store/
  registry.json          # Federated source of truth
  cli/                   # sbs CLI tool (Node.js)
  web/index.html         # GitHub Pages storefront
.github/workflows/
  store-publish.yml      # Auto-update registry on code push
  store-deploy-pages.yml # Deploy web UI to GitHub Pages
  electron-release.yml   # Build & release Electron apps
  registry-sync.yml      # Daily sync from upstream sources
```

## Multi-source federation

The registry supports apps from different GitHub orgs and repos. The `sources` map in `registry.json` defines each repository:

```json
"sources": {
  "studio-core": {
    "org": "my-org",
    "repo": "studio-core",
    "branch": "main",
    "registryPath": "store/registry.json"
  }
}
```

Each app has a `sourceId` that maps to a source. The CLI and web UI use this to construct download URLs, sparse-checkout targets, and release asset links at runtime.

### How federation works

1. The **primary registry** (this repo) lists all known apps with their `sourceId`.
2. Sources with a non-null `registryPath` can maintain their own `registry.json`. The CLI and web UI fetch these and merge new apps automatically.
3. The **registry-sync** workflow runs daily to pull new apps from upstream sources into the primary registry.
4. On conflict (same `id` in multiple sources), the primary registry always wins.

## CLI usage

### Install

```bash
npm install -g sbs
# or
npx sbs list
```

### Commands

```bash
sbs list                    # List all apps
sbs list --source studio-core  # Filter by source
sbs sources                 # List configured sources
sbs info <app-id>           # Show app details + changelog
sbs install <app-id>        # Install an app
sbs update                  # Update all installed apps
sbs update <app-id>         # Update a single app
sbs version                 # Print CLI version
```

### Install methods

| App type | Method | What happens |
|---|---|---|
| Electron | `github-release` | Downloads `.dmg` from GitHub Releases to `~/Downloads/` |
| Node service | `sparse-checkout` | Clones only the app's subdirectory to `~/.sbs/apps/`, runs setup commands, optionally starts with PM2 |
| Web | `hosted` | Opens the hosted URL in the default browser |

## Adding a new source

1. Add an entry to `sources` in `registry.json`:
   ```json
   "new-source": {
     "id": "new-source",
     "label": "New Source",
     "org": "their-github-org",
     "repo": "their-repo",
     "branch": "main",
     "registryPath": "store/registry.json"
   }
   ```
2. Set `registryPath` to the path of their registry file, or `null` if they don't maintain one (you'll manage their apps manually in the primary registry).
3. If the repo is private, add a `FEDERATED_GITHUB_TOKEN` secret with read access to that repo.

## Adding a new app

### Option A — Directly in the primary registry

Add an entry to the `apps` array in `registry.json` with the appropriate `sourceId`, `path`, `install` method, etc.

### Option B — Via a source's own registry

If the source has a non-null `registryPath`, add the app to that repo's `registry.json`. The daily `registry-sync` workflow will pick it up automatically, or run the workflow manually.

## Triggering an Electron release

1. Go to **Actions > Electron Release > Run workflow**
2. Enter the `app-id` (e.g. `ingest-tool`) and `version` (e.g. `1.2.0`)
3. The workflow builds, creates a GitHub Release with tagged assets, and updates the registry

## GitHub Pages deployment

The web storefront deploys automatically after any registry update. You can also trigger it manually via **Actions > Deploy Store Pages > Run workflow**.

The deployed site serves:
- `index.html` — the store UI
- `registry.json` — the registry data (fetched by the UI at runtime)

## Daily registry sync

The `registry-sync` workflow runs at 06:00 UTC daily. It:

1. Reads each source with a non-null `registryPath`
2. Fetches that repo's registry via raw GitHub URL
3. Merges any new apps into the primary registry (existing apps are not overwritten)
4. Commits and pushes if changes were found
5. Triggers a Pages deployment

### Handling conflicts

- **Same app ID in primary and upstream**: Primary always wins. The upstream version is ignored.
- **New app in upstream**: Added automatically with its `sourceId` set to the source it came from.
- To force-update an app from upstream, delete it from the primary registry first, then run the sync.
