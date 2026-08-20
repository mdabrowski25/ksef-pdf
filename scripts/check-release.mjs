import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = (path) => readFile(resolve(root, path), 'utf8');
const packageJson = JSON.parse(await read('package.json'));
const releaseNotesPath = `docs/releases/v${packageJson.version}.md`;
const packageLock = JSON.parse(await read('package-lock.json'));
const changelog = await read('CHANGELOG.md');
const readme = await read('README.md');
const upstream = await read('UPSTREAM.md');
const releaseNotes = await read(releaseNotesPath);
const footerSource = await read('src/upstream/shared/generators/common/functions.ts');
const invoiceGeneratorSources = await Promise.all(
  [
    'src/upstream/lib-public/FA1-generator.ts',
    'src/upstream/lib-public/FA2-generator.ts',
    'src/upstream/lib-public/FA3-generator.ts',
    'src/upstream/lib-public/FARR-generator.ts',
    'src/upstream/lib-public/types/common.types.ts',
  ].map(read),
);

assert.equal(packageJson.engines.node, '>=22');
assert.equal(packageLock.version, packageJson.version);
assert.equal(packageLock.packages[''].version, packageJson.version);
assert.match(changelog, new RegExp(`^## \\[${packageJson.version.replaceAll('.', '\\.')}\\]`, 'm'));
assert.match(upstream, /2b7c1daea6fc3438a4cf28195f2deac75dda4220/);
assert.match(
  releaseNotes,
  new RegExp(`^# ${packageJson.name} v${packageJson.version.replaceAll('.', '\\.')}$`, 'm'),
);
assert.match(footerSource, /packageInfo\.name/);
assert.match(footerSource, /packageInfo\.version/);

for (const source of invoiceGeneratorSources) {
  assert.doesNotMatch(source, /watermark/i, 'Invoice runtime must not expose or render a watermark');
}

for (const relativePath of [
  'CHANGELOG.md',
  'UPSTREAM.md',
  'docs/migration-to-1.0.md',
  releaseNotesPath,
]) {
  assert.ok(readme.includes(relativePath), `README does not link to ${relativePath}`);
  await read(relativePath);
}

if (process.env.GITHUB_REF_TYPE === 'tag') {
  assert.equal(process.env.GITHUB_REF_NAME, `v${packageJson.version}`);
}

console.log(`Release metadata is consistent for v${packageJson.version}.`);
