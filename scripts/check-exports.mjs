import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const requiredExports = [
  'configureFonts',
  'detectInvoiceVersion',
  'detectUpoVersion',
  'generateFA1',
  'generateFA2',
  'generateFA3',
  'generateFARR',
  'generateInvoice',
  'generatePDFUPO',
  'renderPdfBase64FromXml',
  'renderPdfFromXml',
  'renderUpoPdfFromXml',
];

const esm = await import('../dist/index.js');
const require = createRequire(import.meta.url);
const cjs = require('../dist/index.cjs');

for (const name of requiredExports) {
  assert.equal(typeof esm[name], 'function', `Missing ESM export: ${name}`);
  assert.equal(typeof cjs[name], 'function', `Missing CJS export: ${name}`);
}

assert.deepEqual(
  Object.keys(esm).sort(),
  Object.keys(cjs).sort(),
  'ESM and CJS exports differ',
);

console.log(`Verified ${requiredExports.length} public runtime exports in ESM and CJS.`);
