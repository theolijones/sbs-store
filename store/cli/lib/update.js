import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import ora from 'ora';
import { installApp } from './install.js';

const INSTALLED_FILE = path.join(process.env.HOME, '.sbs', 'installed.json');

function readInstalled() {
  try {
    return JSON.parse(fs.readFileSync(INSTALLED_FILE, 'utf-8'));
  } catch {
    return {};
  }
}

function writeInstalled(data) {
  const dir = path.dirname(INSTALLED_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(INSTALLED_FILE, JSON.stringify(data, null, 2));
}

export function recordInstalled(appId, version) {
  const installed = readInstalled();
  installed[appId] = version;
  writeInstalled(installed);
}

export async function updateApp(app, sources) {
  const installed = readInstalled();
  const currentVersion = installed[app.id];

  if (!currentVersion) {
    console.log(chalk.yellow(`${app.name} is not installed. Use "sbs install ${app.id}" first.`));
    return;
  }

  if (currentVersion === app.version) {
    console.log(chalk.green(`${app.name} is already up to date (v${app.version}).`));
    return;
  }

  console.log(chalk.cyan(`Updating ${app.name}: v${currentVersion} -> v${app.version}`));
  await installApp(app, sources);
}

export async function updateApps(registry) {
  const installed = readInstalled();
  const installedIds = Object.keys(installed);

  if (installedIds.length === 0) {
    console.log(chalk.yellow('No apps installed. Use "sbs install <app-id>" to get started.'));
    return;
  }

  const spinner = ora('Checking for updates...').start();
  const outdated = [];

  for (const id of installedIds) {
    const app = registry.apps.find(a => a.id === id);
    if (!app) continue;
    if (installed[id] !== app.version) {
      outdated.push(app);
    }
  }

  if (outdated.length === 0) {
    spinner.succeed('All installed apps are up to date.');
    return;
  }

  spinner.info(`${outdated.length} app(s) need updating.`);

  for (const app of outdated) {
    console.log(chalk.cyan(`\nUpdating ${app.name}: v${installed[app.id]} -> v${app.version}`));
    await installApp(app, registry.sources);
  }
}
