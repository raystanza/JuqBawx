'use strict';
// Regenerates the visualizer and category dropdowns in LivelyProperties.json
// from the live registry, and keeps the visualizer count in LivelyInfo.json's
// description accurate. Run after adding, removing, or reordering a visualizer.
//
//   node tools/sync-properties.cjs          rewrite the files
//   node tools/sync-properties.cjs --check  fail if they are out of date

const fs = require('fs');
const path = require('path');
const { createHarness, ROOT } = require('./headless.cjs');

const checkOnly = process.argv.includes('--check');
const { JuqBawx } = createHarness();
const { registry, internal } = JuqBawx;

const propertiesPath = path.join(ROOT, 'LivelyProperties.json');
const infoPath = path.join(ROOT, 'LivelyInfo.json');

const originalProperties = fs.readFileSync(propertiesPath, 'utf8');
const properties = JSON.parse(originalProperties);

properties.visualizer.items = registry.map(entry => entry.label);
properties.category.items = internal.state.CATEGORIES.map(category => category.label);
if (properties.visualizer.value >= registry.length) properties.visualizer.value = 0;

const nextProperties = JSON.stringify(properties, null, 2) + '\n';

const originalInfo = fs.readFileSync(infoPath, 'utf8');
const info = JSON.parse(originalInfo);
const nextDesc = info.Desc.replace(/^\d+/, String(registry.length));
info.Desc = nextDesc;
const nextInfo = JSON.stringify(info, null, 2) + '\n';

const propertiesChanged = nextProperties !== originalProperties;
const infoChanged = nextInfo !== originalInfo;

if (checkOnly) {
  if (propertiesChanged || infoChanged) {
    const stale = [propertiesChanged && 'LivelyProperties.json', infoChanged && 'LivelyInfo.json'].filter(Boolean);
    process.stderr.write(`Out of date: ${stale.join(', ')}. Run node tools/sync-properties.cjs\n`);
    process.exit(1);
  }
  process.stdout.write(`LivelyProperties.json and LivelyInfo.json match the ${registry.length}-visualizer registry.\n`);
  process.exit(0);
}

if (propertiesChanged) fs.writeFileSync(propertiesPath, nextProperties);
if (infoChanged) fs.writeFileSync(infoPath, nextInfo);

const written = [propertiesChanged && 'LivelyProperties.json', infoChanged && 'LivelyInfo.json'].filter(Boolean);
process.stdout.write(written.length
  ? `Synced ${written.join(' and ')} to the ${registry.length}-visualizer registry.\n`
  : `Already in sync with the ${registry.length}-visualizer registry.\n`);
