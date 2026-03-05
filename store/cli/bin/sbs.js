#!/usr/bin/env node

import { Command } from 'commander';
import { createRequire } from 'module';
import { fetchRegistry } from '../lib/registry.js';
import { installApp } from '../lib/install.js';
import { updateApps, updateApp } from '../lib/update.js';
import { printAppTable, printAppInfo, printSourcesTable } from '../lib/display.js';

const require = createRequire(import.meta.url);
const pkg = require('../package.json');

const program = new Command();

program
  .name('sbs')
  .description('Sportsbet Studio App Store CLI')
  .version(pkg.version);

program
  .command('list')
  .description('List all available apps')
  .option('-s, --source <source-id>', 'Filter by source ID')
  .action(async (opts) => {
    const registry = await fetchRegistry();
    let apps = registry.apps;
    if (opts.source) {
      apps = apps.filter(a => a.sourceId === opts.source);
    }
    printAppTable(apps, registry.sources);
  });

program
  .command('sources')
  .description('List all configured sources')
  .action(async () => {
    const registry = await fetchRegistry();
    printSourcesTable(registry.sources, registry.apps);
  });

program
  .command('info <app-id>')
  .description('Show detailed info for an app')
  .action(async (appId) => {
    const registry = await fetchRegistry();
    const app = registry.apps.find(a => a.id === appId);
    if (!app) {
      console.error(`App "${appId}" not found in registry.`);
      process.exit(1);
    }
    printAppInfo(app, registry.sources);
  });

program
  .command('install <app-id>')
  .description('Install an app')
  .action(async (appId) => {
    const registry = await fetchRegistry();
    const app = registry.apps.find(a => a.id === appId);
    if (!app) {
      console.error(`App "${appId}" not found in registry.`);
      process.exit(1);
    }
    await installApp(app, registry.sources);
  });

program
  .command('update [app-id]')
  .description('Update installed apps (or a single app)')
  .action(async (appId) => {
    const registry = await fetchRegistry();
    if (appId) {
      const app = registry.apps.find(a => a.id === appId);
      if (!app) {
        console.error(`App "${appId}" not found in registry.`);
        process.exit(1);
      }
      await updateApp(app, registry.sources);
    } else {
      await updateApps(registry);
    }
  });

program.parse();
