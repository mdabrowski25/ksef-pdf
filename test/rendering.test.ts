import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  detectInvoiceVersion,
  detectUpoVersion,
  renderPdfBase64FromXml,
  renderPdfFromXml,
  renderUpoPdfFromXml,
} from '../src/index';
import { generatePlatnosc as generateFa1Platnosc } from '../src/upstream/lib-public/generators/FA1/Platnosc';
import { generatePlatnosc as generateFa2Platnosc } from '../src/upstream/lib-public/generators/FA2/Platnosc';
import { generatePlatnosc as generateFa3Platnosc } from '../src/upstream/lib-public/generators/FA3/Platnosc';
import { generatePageFooter } from '../src/upstream/shared/PDF-functions';

const invoiceXml = readFileSync(join(process.cwd(), 'test/fixtures/invoice-fa2.xml'), 'utf8');
const upoXml = readFileSync(join(process.cwd(), 'test/fixtures/upo-v4_3.xml'), 'utf8');

function pdfHeader(bytes: Uint8Array): string {
  return Buffer.from(bytes).subarray(0, 4).toString('utf8');
}

function collectText(value: unknown): string[] {
  if (typeof value === 'string') {
    return [value];
  }
  if (Array.isArray(value)) {
    return value.flatMap(collectText);
  }
  if (value && typeof value === 'object') {
    return Object.values(value).flatMap(collectText);
  }
  return [];
}

describe('KSeF PDF renderer', () => {
  it('detects FA(3) invoice schema', () => {
    expect(detectInvoiceVersion(invoiceXml)).toBe('FA(3)');
  });

  it('renders invoice xml to PDF bytes', async () => {
    const pdfBytes = await renderPdfFromXml(invoiceXml);

    expect(pdfBytes.length).toBeGreaterThan(5000);
    expect(pdfHeader(pdfBytes)).toBe('%PDF');
  });

  it('renders invoice xml to base64', async () => {
    const base64 = await renderPdfBase64FromXml(invoiceXml);

    expect(base64.length).toBeGreaterThan(1000);
    expect(Buffer.from(base64, 'base64').subarray(0, 4).toString('utf8')).toBe('%PDF');
  });

  it('detects UPO version from XML namespace', () => {
    expect(detectUpoVersion(upoXml)).toBe('UPO(4.3)');
  });

  it('renders UPO xml to PDF bytes', async () => {
    const pdfBytes = await renderUpoPdfFromXml(upoXml);

    expect(pdfBytes.length).toBeGreaterThan(5000);
    expect(pdfHeader(pdfBytes)).toBe('%PDF');
  });

  it('formats payment deadlines as DD.MM.YYYY in payment tables', () => {
    const renderedPaymentTexts = [
      generateFa1Platnosc({
        TerminyPlatnosci: {
          TerminPlatnosci: { _text: '2026-03-30' },
        },
      } as any),
      generateFa2Platnosc({
        TerminPlatnosci: {
          Termin: { _text: '2026-03-30' },
        },
      } as any),
      generateFa3Platnosc({
        TerminPlatnosci: {
          Termin: { _text: '2026-03-30' },
        },
      } as any),
    ].map((content) => collectText(content));

    for (const texts of renderedPaymentTexts) {
      expect(texts).toContain('30.03.2026');
      expect(texts).not.toContain('2026-03-30');
    }
  });

  it('formats page footer like the official KSeF visualization', () => {
    expect(generatePageFooter(1, 2)).toMatchObject({
      text: '1 z 2',
      alignment: 'right',
      margin: [0, 0, 20, 0],
    });
  });
});
