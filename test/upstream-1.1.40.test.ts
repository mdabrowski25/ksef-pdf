// @vitest-environment node
import { readFileSync } from 'node:fs';
import pdfMake from 'pdfmake/build/pdfmake.js';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  detectInvoiceVersion,
  detectPefInvoiceVersion,
  generateInvoice,
  generatePDFUPO,
  renderPdfBase64FromXml,
  renderPdfFromXml,
  renderUpoPdfFromXml,
  type XmlInput,
} from '../src/index';
import { xmlInputToString } from '../src/xml-input';
import { parseXML } from '../src/upstream/shared/XML-parser';
import { generateTransport as fa1Transport } from '../src/upstream/lib-public/generators/FA1/Transport';
import { generateTransport as fa2Transport } from '../src/upstream/lib-public/generators/FA2/Transport';
import { generateTransport as fa3Transport } from '../src/upstream/lib-public/generators/FA3/Transport';
import packageInfo from '../package.json';

const fixture = (name: string) => readFileSync(`test/fixtures/${name}.xml`, 'utf8');
const fa = fixture('invoice-fa2');
const upo = fixture('upo-v4_3');
const pdfHeader = (bytes: Uint8Array) => Buffer.from(bytes).subarray(0, 4).toString();

function textNodes(value: any): string {
  if (value == null || typeof value === 'function') return '';
  if (typeof value !== 'object') return String(value);
  if (Array.isArray(value)) return value.map(textNodes).join(' ');
  if ('text' in value) return textNodes(value.text);
  return Object.values(value).map(textNodes).join(' ');
}

function encode(xml: string, encoding: string): Uint8Array {
  if (encoding === 'utf8') return Buffer.from(xml);
  if (encoding === 'utf8-bom') return Buffer.from('\ufeff' + xml);
  const bytes = Buffer.from((encoding.endsWith('bom') ? '\ufeff' : '') + xml, 'utf16le');
  return encoding.startsWith('be') ? bytes.swap16() : bytes;
}

const inputTypes: Record<string, (bytes: Uint8Array) => XmlInput> = {
  bytes: (bytes) => bytes,
  arrayBuffer: (bytes) => Uint8Array.from(bytes).buffer,
  blob: (bytes) => new Blob([Uint8Array.from(bytes)]),
  file: (bytes) => new File([Uint8Array.from(bytes)], 'invoice.xml'),
  subarray: (bytes) => Buffer.concat([Buffer.from('prefix'), bytes, Buffer.from('suffix')]).subarray(6, 6 + bytes.length),
};

afterEach(() => vi.restoreAllMocks());

describe('XML encoding and Node input compatibility', () => {
  for (const encoding of ['utf8', 'utf8-bom', 'le', 'le-bom', 'be', 'be-bom']) {
    it.each(Object.entries(inputTypes))(`decodes ${encoding} %s without losing Polish characters`, async (_name, input) => {
      const xml = '<?xml version="1.0"?><root>Zażółć gęślą jaźń</root>';
      expect(await xmlInputToString(input(encode(xml, encoding)))).toBe(xml);
    });
  }

  it.each(Object.entries(inputTypes))('renders UTF-16 %s through the public invoice API', async (_name, input) => {
    const createPdf = vi.spyOn(pdfMake, 'createPdf');
    const bytes = await renderPdfFromXml(input(encode(fa, 'be-bom')), {
      nrKSeF: '1111111111-20260925-ABCDEF123456-01',
      qrCode: 'https://example.com/qr1',
      qr2Code: 'https://example.com/qr2',
      ksefAcquisitionDate: new Date('2026-09-25T10:30:00Z'),
    });
    expect(pdfHeader(bytes)).toBe('%PDF');
    const definition = createPdf.mock.calls[0][0];
    const text = textNodes(definition.content);
    expect(text).toContain('Dróżdż');
    expect(text).toContain('25.09.2026');
    expect(text).toContain('1111111111-20260925-ABCDEF123456-01');
    expect(text).toContain(packageInfo.name);
    expect(text).toContain(packageInfo.version);
    expect(JSON.stringify(definition)).toContain('https://example.com/qr1');
    expect(JSON.stringify(definition)).toContain('https://example.com/qr2');
    expect(definition).not.toHaveProperty('watermark');
  });

  it('decodes native Node File input in the vendored parser', async () => {
    const file = new File([Uint8Array.from(encode('<root><ns:name>Łódź</ns:name></root>', 'le-bom'))], 'test.xml');
    expect(await parseXML(file)).toMatchObject({ root: { name: { _text: 'Łódź' } } });
  });

  it('keeps both UPO entry points working with UTF-16', async () => {
    expect(pdfHeader(await renderUpoPdfFromXml(encode(upo, 'be')))).toBe('%PDF');
    expect(pdfHeader(await generatePDFUPO(encode(upo.replace('/KSeF/v4-3', '/KSeF/v4-2'), 'le-bom')))).toBe('%PDF');
  });

  it('rejects malformed XML and unsupported input types', async () => {
    await expect(renderPdfFromXml(encode('<Faktura><bad></Faktura>', 'be-bom'))).rejects.toThrow();
    await expect(renderPdfFromXml(42 as any)).rejects.toThrow('Unsupported XML input type');
  });
});

describe('PEF through the Node package API', () => {
  it.each([
    ['basic', 'PEF', '1 230,00'],
    ['specialized', 'PEF-SPECIALIZED', '1 230,00'],
    ['corrective', 'PEF-CORRECTIVE', '-246,00'],
  ])('detects and renders %s with actual invoice content', async (kind, version, amount) => {
    const xml = fixture(`invoice-pef-${kind}`);
    expect(detectPefInvoiceVersion(xml)).toBe(version);
    expect(detectInvoiceVersion(xml)).toBeNull();
    const createPdf = vi.spyOn(pdfMake, 'createPdf');
    const bytes = await renderPdfFromXml(xml, { nrKSeF: 'PEF-KSEF-123' });
    expect(pdfHeader(bytes)).toBe('%PDF');
    const definition = createPdf.mock.calls[0][0];
    const text = textNodes(definition.content);
    expect(text).toContain(`PEF-${kind}/2026/001`);
    expect(text).toContain('Żółć Test Sp. z o.o.');
    expect(text).toContain('Usługa wdrożeniowa Łódź');
    expect(text).toContain(amount);
    expect(text).toContain('PLN');
    expect(text).toContain('PEF-KSEF-123');
    expect(text).toContain(packageInfo.name);
    expect(text).toContain(packageInfo.version);
    expect(definition).not.toHaveProperty('watermark');
    if (kind === 'corrective') {
      expect(text).toContain('1 230,00');
      expect(text).toContain('984,00');
    }
  });

  it('preserves byte, Base64, and Blob output for PEF', async () => {
    const xml = encode(fixture('invoice-pef-basic'), 'le-bom');
    expect(pdfHeader(await generateInvoice(xml, { nrKSeF: '' }, 'uint8array'))).toBe('%PDF');
    expect(pdfHeader(Buffer.from(await generateInvoice(xml, { nrKSeF: '' }, 'base64'), 'base64'))).toBe('%PDF');
    const blob = await generateInvoice(xml, { nrKSeF: '' }, 'blob');
    expect(blob.type).toBe('application/pdf');
    expect(pdfHeader(new Uint8Array(await blob.arrayBuffer()))).toBe('%PDF');
    expect(pdfHeader(Buffer.from(await renderPdfBase64FromXml(xml), 'base64'))).toBe('%PDF');
  });

  it('rejects unknown PEF profiles and profiles attached to the wrong root', async () => {
    const unknown = fixture('invoice-pef-basic').replace('urn:fdc:peppol.eu:2017:poacc:billing:01:1.0', 'urn:unsupported');
    const wrongRoot = fixture('invoice-pef-corrective').replace('<CreditNote ', '<Invoice ').replace('</CreditNote>', '</Invoice>');
    for (const xml of [unknown, wrongRoot]) {
      expect(detectPefInvoiceVersion(xml)).toBeNull();
      await expect(renderPdfFromXml(xml)).rejects.toThrow('Unsupported or missing invoice version');
    }
    expect(detectPefInvoiceVersion(fa)).toBeNull();
  });
});

it.each([fa1Transport, fa2Transport, fa3Transport])('renders other cargo without requiring a standard cargo code', (generateTransport) => {
  const content = generateTransport({
    LadunekInny: { _text: '1' },
    OpisInnegoLadunku: { _text: 'Ładunek specjalny' },
  } as any);
  expect(textNodes(content)).toContain('Ładunek specjalny');
});
