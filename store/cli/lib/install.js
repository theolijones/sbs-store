import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import ora from 'ora';
import open from 'open';
import chalk from 'chalk';
import { releaseAssetUrl, sparseCheckoutUrl } from './sources.js';
import { recordInstalled } from './update.js';

const SBS_HOME = path.join(process.env.HOME, '.sbs');
const APPS_DIR = path.join(SBS_HOME, 'apps');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

export async function installApp(app, sources) {
  const source = sources[app.sourceId];
  if (!source) {
    console.error(chalk.red(`Source "${app.sourceId}" not found for app "${app.id}".`));
    process.exit(1);
  }

  switch (app.install.method) {
    case 'github-release':
      await installElectron(app, source);
      break;
    case 'sparse-checkout':
      await installNodeService(app, source);
      break;
    case 'hosted':
      await installWeb(app);
      break;
    default:
      console.error(chalk.red(`Unknown install method: ${app.install.method}`));
      process.exit(1);
  }

  recordInstalled(app.id, app.version);
  console.log(chalk.green(`\n${app.name} v${app.version} installed successfully.`));
}

async function installElectron(app, source) {
  const tag = (app.install.releaseTag || `${app.id}-v{version}`).replace('{version}', app.version);
  const asset = app.install.releaseAsset.replace('{version}', app.version);
  const url = releaseAssetUrl(source, tag, asset);
  const dest = path.join(process.env.HOME, 'Downloads', asset);

  const spinner = ora(`Downloading ${asset}...`).start();
  try {
    execSync(`curl -fSL -o "${dest}" "${url}"`, { stdio: 'pipe' });
    spinner.succeed(`Downloaded to ${dest}`);
    console.log(chalk.cyan(`Open the .dmg file to install: open "${dest}"`));
  } catch (err) {
    spinner.fail('Download failed.');
    console.error(chalk.yellow(`Manual download: ${url}`));
  }
}

async function installNodeService(app, source) {
  const repoUrl = sparseCheckoutUrl(source);
  const appDir = path.join(APPS_DIR, app.id);

  ensureDir(APPS_DIR);

  const spinner = ora(`Cloning ${app.id} via sparse-checkout...`).start();
  try {
    if (fs.existsSync(appDir)) {
      execSync(`rm -rf "${appDir}"`, { stdio: 'pipe' });
    }
    execSync(
      `git clone --sparse --filter=blob:none --branch ${source.branch} "${repoUrl}" "${appDir}"`,
      { stdio: 'pipe' }
    );
    execSync(`git -C "${appDir}" sparse-checkout set "${app.path}"`, { stdio: 'pipe' });
    spinner.succeed('Clone complete.');
  } catch (err) {
    spinner.fail(`Sparse-checkout failed: ${err.message}`);
    process.exit(1);
  }

  const workDir = path.join(appDir, app.path);
  if (app.install.runAfter) {
    for (const cmd of app.install.runAfter) {
      const cmdSpinner = ora(`Running: ${cmd}`).start();
      try {
        execSync(cmd, { cwd: workDir, stdio: 'pipe' });
        cmdSpinner.succeed(cmd);
      } catch {
        cmdSpinner.fail(`Failed: ${cmd}`);
        process.exit(1);
      }
    }
  }

  if (app.install.processManager === 'pm2') {
    try {
      execSync('which pm2', { stdio: 'pipe' });
      const spinner2 = ora('Starting with PM2...').start();
      try {
        execSync(`pm2 start "${workDir}/package.json" --name "${app.id}"`, { stdio: 'pipe' });
        spinner2.succeed(`${app.id} running under PM2.`);
      } catch {
        execSync(`pm2 reload "${app.id}"`, { stdio: 'pipe' });
        spinner2.succeed(`${app.id} reloaded under PM2.`);
      }
    } catch {
      console.log(chalk.yellow('\nPM2 not found. Start manually:'));
      console.log(chalk.cyan(`  cd ${workDir} && npm start`));
    }
  }
}

async function installWeb(app) {
  const url = app.install.url;
  const spinner = ora(`Opening ${app.name} in browser...`).start();
  await open(url);
  spinner.succeed(`Opened ${url}`);
}
