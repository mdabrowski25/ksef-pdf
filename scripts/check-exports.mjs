import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';

const requiredExports = [
  'configureFonts',
  'detectInvoiceVersion',
  'detectPefInvoiceVersion',
  'detectUpoVersion',
  'generateFA1',
  'generateFA2',
  'generateFA3',
  'generateFARR',
  'generateBasicPEF',
  'generateCorrectivePEF',
  'generateSpecPEF',
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

// Exercise the built bundles without Vitest transforms or mocks.
const readFixture = (name) => readFile(new URL(`../test/fixtures/${name}.xml`, import.meta.url), 'utf8');
const fa = await readFixture('invoice-fa2');
const invoices = [
  fa.replace('FA (3)', 'FA (1)').replace('<WariantFormularza>3', '<WariantFormularza>1'),
  fa.replace('FA (3)', 'FA (2)').replace('<WariantFormularza>3', '<WariantFormularza>2'),
  fa,
  await readFixture('invoice-farr'),
  await readFixture('invoice-pef-basic'),
  await readFixture('invoice-pef-corrective'),
  await readFixture('invoice-pef-specialized'),
];
const upo = await readFixture('upo-v4_3');
for (const [format, api] of [['ESM', esm], ['CJS', cjs]]) {
  for (const xml of invoices) {
    const file = new File([Buffer.from(`\ufeff${xml}`, 'utf16le')], 'invoice.xml');
    const bytes = await api.renderPdfFromXml(file);
    assert.equal(Buffer.from(bytes).subarray(0, 4).toString(), '%PDF', `${format} invoice rendering failed`);
  }
  for (const xml of [upo, upo.replace('/KSeF/v4-3', '/KSeF/v4-2')]) {
    const bytes = await api.renderUpoPdfFromXml(Buffer.from(xml));
    assert.equal(Buffer.from(bytes).subarray(0, 4).toString(), '%PDF', `${format} UPO rendering failed`);
  }
}
console.log('Rendered all seven invoice layouts and both UPO versions through ESM and CJS.');
