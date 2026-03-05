# sbs — Sportsbet Studio CLI

Install and manage studio apps from a federated multi-source registry.

## Install

```bash
npm install -g sbs
```

Or run directly:

```bash
npx sbs list
```

## Commands

| Command | Description |
|---|---|
| `sbs list` | List all apps |
| `sbs list --source <id>` | Filter apps by source |
| `sbs sources` | List configured sources |
| `sbs info <app-id>` | Show app details and changelog |
| `sbs install <app-id>` | Install an app |
| `sbs update` | Update all installed apps |
| `sbs update <app-id>` | Update a single app |
| `sbs version` | Print CLI version |

## Data

Installed app versions are tracked in `~/.sbs/installed.json`. Node service apps are cloned to `~/.sbs/apps/`.
