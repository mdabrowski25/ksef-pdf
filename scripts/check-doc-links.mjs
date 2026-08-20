import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const packageJson = JSON.parse(await readFile(resolve(root, 'package.json'), 'utf8'));
const documents = [
  'README.md',
  'CHANGELOG.md',
  'UPSTREAM.md',
  'docs/migration-to-1.0.md',
  `docs/releases/v${packageJson.version}.md`,
];

for (const relativeDocument of documents) {
  const absoluteDocument = resolve(root, relativeDocument);
  const markdown = await readFile(absoluteDocument, 'utf8');

  for (const [, rawTarget] of markdown.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
    const target = rawTarget.trim().replace(/^<|>$/g, '').split('#', 1)[0];

    if (!target || /^(?:https?:|mailto:)/i.test(target)) {
      continue;
    }

    assert.ok(!target.startsWith('/'), `${relativeDocument} uses a non-portable absolute link: ${target}`);
    await access(resolve(dirname(absoluteDocument), decodeURIComponent(target)));
  }
}

console.log(`Verified relative links in ${documents.length} documentation files.`);
