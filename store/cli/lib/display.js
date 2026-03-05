import chalk from 'chalk';
import Table from 'cli-table3';

const TYPE_COLORS = {
  electron: chalk.magenta,
  'node-service': chalk.green,
  web: chalk.blue,
  'python-app': chalk.yellow,
};

function typeLabel(type) {
  const colorFn = TYPE_COLORS[type] || chalk.white;
  return colorFn(type);
}

export function printAppTable(apps, sources) {
  if (apps.length === 0) {
    console.log(chalk.yellow('No apps found.'));
    return;
  }

  const table = new Table({
    head: ['Name', 'Version', 'Type', 'Source', 'Description'],
    colWidths: [20, 10, 15, 18, 45],
    wordWrap: true,
  });

  for (const app of apps) {
    const source = sources[app.sourceId];
    const sourceLabel = source ? source.label : app.sourceId;
    table.push([
      app.name,
      app.version,
      typeLabel(app.type),
      sourceLabel,
      app.description,
    ]);
  }

  console.log(table.toString());
}

export function printSourcesTable(sources, apps) {
  const table = new Table({
    head: ['ID', 'Label', 'Org / Repo', 'Apps'],
    colWidths: [20, 22, 35, 8],
  });

  for (const [id, source] of Object.entries(sources)) {
    const count = apps.filter(a => a.sourceId === id).length;
    table.push([
      id,
      source.label,
      `${source.org}/${source.repo}`,
      String(count),
    ]);
  }

  console.log(table.toString());
}

export function printAppInfo(app, sources) {
  const source = sources[app.sourceId];
  const sourceLabel = source ? `${source.label} (${source.org}/${source.repo})` : app.sourceId;

  console.log(chalk.bold.white(`\n  ${app.name}`) + chalk.gray(` v${app.version}`));
  console.log(chalk.gray(`  ${'─'.repeat(50)}`));
  console.log(`  ${chalk.gray('ID:')}           ${app.id}`);
  console.log(`  ${chalk.gray('Type:')}         ${typeLabel(app.type)}`);
  console.log(`  ${chalk.gray('Source:')}       ${sourceLabel}`);
  console.log(`  ${chalk.gray('Author:')}       ${app.author}`);
  console.log(`  ${chalk.gray('Updated:')}      ${app.updated}`);
  console.log(`  ${chalk.gray('Description:')}  ${app.description}`);

  if (app.path) {
    console.log(`  ${chalk.gray('Path:')}         ${app.path}`);
  }

  if (app.install.method) {
    console.log(`  ${chalk.gray('Install:')}      ${app.install.method}`);
  }

  if (app.tags && app.tags.length) {
    console.log(`  ${chalk.gray('Tags:')}         ${app.tags.map(t => chalk.cyan(t)).join(', ')}`);
  }

  if (app.changelog && app.changelog.length) {
    console.log(chalk.gray(`\n  Changelog:`));
    for (const entry of app.changelog) {
      console.log(`    ${chalk.white(entry.version)} ${chalk.gray(`(${entry.date})`)} — ${entry.notes}`);
    }
  }

  console.log();
}
