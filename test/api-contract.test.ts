import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import pdfMake from 'pdfmake/build/pdfmake.js';
import pdfFonts from 'pdfmake/build/vfs_fonts.js';
import { xml2js } from 'xml-js';
import { describe, expect, it } from 'vitest';
import {
  configureFonts,
  detectInvoiceVersion,
  generateFA1,
  generateFA2,
  generateFA3,
  generateFARR,
  generateInvoice,
  generatePDFUPO,
  renderPdfFromXml,
} from '../src/index';

const fixture = (name: string) => readFileSync(join(process.cwd(), 'test/fixtures', name), 'utf8');
const fa3Xml = fixture('invoice-fa2.xml');
const farrXml = fixture('invoice-farr.xml');
const upoXml = fixture('upo-v4_3.xml');

describe('public 1.0 API contract', () => {
  it('keeps the documented 0.2.3 functions and adds 1.0 capabilities', () => {
    expect(configureFonts).toBeTypeOf('function');
    expect(generateFA3).toBeTypeOf('function');
    expect(generateFARR).toBeTypeOf('function');
    expect(generateInvoice).toBeTypeOf('function');
    expect(generatePDFUPO).toBeTypeOf('function');
  });

  it('denies local and remote pdfmake resources by default', () => {
    expect((pdfMake as any).localAccessPolicy('C:/private/font.ttf')).toBe(false);
    expect((pdfMake as any).urlAccessPolicy('https://example.com/image.png')).toBe(false);
  });

  it.each([
    ['FA (1)', 'FA(1)'],
    ['FA(1)', 'FA(1)'],
    ['FA (2)', 'FA(2)'],
    ['FA(3)', 'FA(3)'],
    ['FA_RR (1)', 'FA_RR(1)'],
    ['FA_RR(1)', 'FA_RR(1)'],
  ])('normalizes %s', (schema, expected) => {
    const xml = `<Faktura><Naglowek><KodFormularza kodSystemowy="${schema}" /></Naglowek></Faktura>`;
    expect(detectInvoiceVersion(xml)).toBe(expected);
  });

  it('preserves generateInvoice byte, base64, and blob formats', async () => {
    const additionalData = { nrKSeF: '' };
    const bytes = await generateInvoice(fa3Xml, additionalData, 'uint8array');
    const base64 = await generateInvoice(fa3Xml, additionalData, 'base64');
    const blob = await generateInvoice(fa3Xml, additionalData, 'blob');

    expect(Buffer.from(bytes).subarray(0, 4).toString()).toBe('%PDF');
    expect(Buffer.from(base64, 'base64').subarray(0, 4).toString()).toBe('%PDF');
    expect(blob.type).toBe('application/pdf');
  });

  it('preserves generatePDFUPO byte and blob formats', async () => {
    const bytes = await generatePDFUPO(upoXml);
    const blob = await generatePDFUPO(upoXml, 'blob');

    expect(Buffer.from(bytes).subarray(0, 4).toString()).toBe('%PDF');
    expect(blob.type).toBe('application/pdf');
  });

  it.each([
    ['FA(1)', generateFA1, fa3Xml.replace('FA (3)', 'FA (1)').replace('<WariantFormularza>3', '<WariantFormularza>1')],
    ['FA(2)', generateFA2, fa3Xml.replace('FA (3)', 'FA (2)').replace('<WariantFormularza>3', '<WariantFormularza>2')],
    ['FA(3)', generateFA3, fa3Xml],
    ['FA_RR(1)', generateFARR, farrXml],
  ])('uses Promise-based pdfmake methods for low-level %s generation', async (_version, generator, xml) => {
    const parsed = xml2js(xml, { compact: true }) as any;
    const document = generator(parsed.Faktura as never, { nrKSeF: '' });
    const pending = document.getBuffer();

    expect(pending).toBeInstanceOf(Promise);
    expect(Buffer.from(await pending).subarray(0, 4).toString()).toBe('%PDF');
  });

  it('renders FA_RR and the new invoice metadata options without a watermark option', async () => {
    const bytes = await renderPdfFromXml(farrXml, {
      nrKSeF: '1111111111-20260820-TEST00000000-01',
      qrCode: 'https://qr-test.ksef.mf.gov.pl/invoice/example',
      qr2Code: 'https://qr-test.ksef.mf.gov.pl/certificate/example',
      ksefAcquisitionDate: '2026-08-20T12:00:00Z',
    });

    expect(Buffer.from(bytes).subarray(0, 4).toString()).toBe('%PDF');
  });

  it('renders with a custom font registered only through the in-memory VFS', async () => {
    configureFonts({
      vfs: pdfFonts,
      fonts: {
        Company: {
          normal: 'Roboto-Regular.ttf',
          bold: 'Roboto-Medium.ttf',
          italics: 'Roboto-Italic.ttf',
          bolditalics: 'Roboto-MediumItalic.ttf',
        },
      },
    });

    const bytes = await renderPdfFromXml(fa3Xml);
    expect(Buffer.from(bytes).subarray(0, 4).toString()).toBe('%PDF');
  });
});
