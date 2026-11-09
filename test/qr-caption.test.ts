// @vitest-environment node
import { readFileSync } from 'node:fs';
import pdfMake from 'pdfmake/build/pdfmake.js';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderPdfFromXml } from '../src/index';

const QR1 = 'https://qr-test.ksef.mf.gov.pl/invoice/example';
const QR2 = 'https://qr-test.ksef.mf.gov.pl/certificate/example';
const KSEF_NUMBER = '1111111111-20260925-ABCDEF123456-01';
const fixture = (name: string) => readFileSync(`test/fixtures/${name}.xml`, 'utf8');

// The text printed directly below the QR code that encodes `url`.
function captionBelow(value: any, url: string): unknown {
  if (value == null || typeof value !== 'object') return undefined;
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = captionBelow(item, url);
      if (found !== undefined) return found;
    }
    return undefined;
  }
  if (Array.isArray(value.stack) && value.stack[0]?.qr === url) return value.stack[1]?.text ?? null;
  return captionBelow(Object.values(value), url);
}

async function render(xml: string, options: Parameters<typeof renderPdfFromXml>[1]) {
  const createPdf = vi.spyOn(pdfMake, 'createPdf');
  await renderPdfFromXml(xml, options);
  return createPdf.mock.calls[0][0];
}

afterEach(() => vi.restoreAllMocks());

// KSeF: the number once it is known (online invoices and offline invoices already sent), OFFLINE until then.
describe.each([
  ['FA', 'invoice-fa2'],
  ['FA_RR', 'invoice-farr'],
  ['PEF', 'invoice-pef-basic'],
])('QR1 caption on %s invoices', (_kind, name) => {
  it('is OFFLINE on an offline invoice that has no KSeF number yet', async () => {
    const definition = await render(fixture(name), { qrCode: QR1, qr2Code: QR2 });
    expect(captionBelow(definition.content, QR1)).toBe('OFFLINE');
    expect(captionBelow(definition.content, QR2)).toBe('CERTYFIKAT');
  });

  it('is the KSeF number on an offline invoice already accepted by KSeF', async () => {
    const definition = await render(fixture(name), { nrKSeF: KSEF_NUMBER, qrCode: QR1, qr2Code: QR2 });
    expect(captionBelow(definition.content, QR1)).toBe(KSEF_NUMBER);
    expect(captionBelow(definition.content, QR2)).toBe('CERTYFIKAT');
  });

  it('is the KSeF number on an online invoice', async () => {
    const definition = await render(fixture(name), { nrKSeF: KSEF_NUMBER, qrCode: QR1 });
    expect(captionBelow(definition.content, QR1)).toBe(KSEF_NUMBER);
  });

  it('is OFFLINE on an online invoice still waiting for its number', async () => {
    const definition = await render(fixture(name), { qrCode: QR1 });
    expect(captionBelow(definition.content, QR1)).toBe('OFFLINE');
  });
});
