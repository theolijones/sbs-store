import fetch from 'node-fetch';
import ora from 'ora';
import { registryUrl } from './sources.js';

const PRIMARY_REGISTRY_URL = 'https://raw.githubusercontent.com/theolijones/sbs-store/main/store/registry.json';

/**
 * Fetch the primary registry and optionally merge federated sources.
 */
export async function fetchRegistry(options = {}) {
  const { federated = true } = options;
  const spinner = ora('Fetching registry...').start();

  let primary;
  try {
    const res = await fetch(PRIMARY_REGISTRY_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    primary = await res.json();
  } catch (err) {
    spinner.fail(`Failed to fetch primary registry: ${err.message}`);
    process.exit(1);
  }

  const sources = primary.sources || {};
  let apps = [...primary.apps];
  const knownIds = new Set(apps.map(a => a.id));

  if (federated) {
    for (const [sourceId, source] of Object.entries(sources)) {
      const url = registryUrl(source);
      if (!url) continue;
      // Skip the primary source to avoid re-fetching itself
      if (url === PRIMARY_REGISTRY_URL) continue;

      try {
        const res = await fetch(url);
        if (!res.ok) continue;
        const remote = await res.json();
        for (const app of (remote.apps || [])) {
          if (!knownIds.has(app.id)) {
            apps.push({ ...app, sourceId: app.sourceId || sourceId });
            knownIds.add(app.id);
          }
        }
      } catch {
        // Silently skip unreachable sources
      }
    }
  }

  spinner.succeed('Registry loaded.');

  return {
    schemaVersion: primary.schemaVersion,
    storeVersion: primary.storeVersion,
    lastUpdated: primary.lastUpdated,
    sources,
    apps,
  };
}
