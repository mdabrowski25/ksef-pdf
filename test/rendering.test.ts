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

const invoiceXml = readFileSync(join(process.cwd(), 'test/fixtures/invoice-fa2.xml'), 'utf8');
const upoXml = readFileSync(join(process.cwd(), 'test/fixtures/upo-v4_3.xml'), 'utf8');

function pdfHeader(bytes: Uint8Array): string {
  return Buffer.from(bytes).subarray(0, 4).toString('utf8');
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
});
