// @vitest-environment node
import { readFileSync } from 'node:fs';
import pdfMake from 'pdfmake/build/pdfmake.js';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderPdfFromXml } from '../src/index';
import { formatBigInt, toBigInt } from '../src/upstream/shared/PDF-functions';
import { SectionType } from '../src/upstream/shared/enums/pef-invoice.enum';
import { getSummaryTaxRate as fa1Summary, generatePodsumowanieStawekPodatkuVat as fa1Vat } from '../src/upstream/lib-public/generators/FA1/PodsumowanieStawekPodatkuVat';
import { getSummaryTaxRate as fa2Summary, generatePodsumowanieStawekPodatkuVat as fa2Vat } from '../src/upstream/lib-public/generators/FA2/PodsumowanieStawekPodatkuVat';
import { getSummaryTaxRate as fa3Summary, generatePodsumowanieStawekPodatkuVat as fa3Vat } from '../src/upstream/lib-public/generators/FA3/PodsumowanieStawekPodatkuVat';
import { generateTransport as fa1Transport } from '../src/upstream/lib-public/generators/FA1/Transport';
import { generateTransport as fa2Transport } from '../src/upstream/lib-public/generators/FA2/Transport';
import { generateTransport as fa3Transport } from '../src/upstream/lib-public/generators/FA3/Transport';
import { generateRabat as fa1Discount } from '../src/upstream/lib-public/generators/FA1/Rabat';
import { generateRabat as fa2Discount } from '../src/upstream/lib-public/generators/FA2/Rabat';
import { generateRabat as fa3Discount } from '../src/upstream/lib-public/generators/FA3/Rabat';
import { generatePodmiot2Podmiot2K } from '../src/upstream/lib-public/generators/FA3/Podmiot2Podmiot2k';
import { generateInvoiceHeader } from '../src/upstream/lib-public/generators/PEF/InvoiceHeader';
import { generateLegalMonetaryTotal } from '../src/upstream/lib-public/generators/PEF/LegalMonetaryTotal';
import { generateNaglowek } from '../src/upstream/lib-public/generators/common/Naglowek';
import { generateRozliczenie } from '../src/upstream/lib-public/generators/common/Rozliczenie';

// Exercise the real decimal conversion and formatting, rather than the
// floating-point substitutes used in upstream's isolated generator tests.
vi.unmock('../src/upstream/shared/PDF-functions');

function textNodes(value: any): string {
  if (value == null || typeof value === 'function') return '';
  if (typeof value !== 'object') return String(value);
  if (Array.isArray(value)) return value.map(textNodes).join(' ');
  if ('text' in value) return textNodes(value.text);
  return Object.values(value).map(textNodes).join(' ');
}

function tableRows(value: any): any[][] {
  if (value == null || typeof value !== 'object') return [];
  if (Array.isArray(value)) return value.flatMap(tableRows);
  return [
    ...(value.table?.body ?? []),
    ...Object.values(value).flatMap(tableRows),
  ];
}

afterEach(() => vi.restoreAllMocks());

describe('exact cents conversion', () => {
  it.each([
    [' -1.23 ', '-1.23'],
    ['\n-0.01\t', '-0.01'],
    [' +1.23 ', '1.23'],
    ['-1,23', '-1.23'],
    ['.5', '0.50'],
    ['-.5', '-0.50'],
    ['0', '0.00'],
    ['-0.00', '0.00'],
    ['0.01', '0.01'],
    ['100000000000000.01', '100000000000000.01'],
    ['-100000000000000.01', '-100000000000000.01'],
  ])('preserves %j as %s', (value, expected) => {
    expect(formatBigInt(toBigInt({ _text: value }))).toBe(expected);
    expect(formatBigInt(toBigInt(value))).toBe(expected);
  });

  it.each([undefined, '', ' \n\t', 0, -0])('treats missing or zero input %j as zero cents', (value) => {
    expect(toBigInt(value)).toBe(0n);
  });

  it.each([
    [0.01, '0.01'],
    [-0.01, '-0.01'],
    [1e-7, '0.00'],
    [1e21, '1000000000000000000000.00'],
  ])('handles the native numeric input %s', (value, expected) => {
    expect(formatBigInt(toBigInt(value))).toBe(expected);
  });

  it.each(['not-an-amount', '1.2.3', '--1.23', NaN, Infinity, -Infinity])(
    'rejects malformed nonempty input %s rather than rendering an incorrect amount', (value) => {
      expect(() => toBigInt(value)).toThrow('Invalid decimal amount');
    },
  );

  it.each([
    ['1.004', '1.00'],
    ['1.005', '1.01'],
    ['-1.005', '-1.01'],
    ['123.456', '123.46'],
    ['9.999', '10.00'],
    ['-0.005', '-0.01'],
  ])('rounds excess decimal places away from zero at a tie: %s', (value, expected) => {
    expect(formatBigInt(toBigInt(value))).toBe(expected);
  });
});

describe.each([
  ['FA(1)', fa1Summary, fa1Vat],
  ['FA(2)', fa2Summary, fa2Vat],
  ['FA(3)', fa3Summary, fa3Vat],
] as const)('%s VAT summaries', (_version, summary, vat) => {
  it('adds very large XML amounts without losing a cent', () => {
    expect(summary({
      P_13_1: { _text: '100000000000000.01' },
      P_14_1: { _text: '0.01' },
    })[0]).toMatchObject({
      net: '100000000000000.01', tax: '0.01', gross: '100000000000000.02',
    });
  });

  it('preserves negative correction values surrounded by XML whitespace', () => {
    expect(summary({
      P_13_1: { _text: '\n -1.23 ' },
      P_14_1: { _text: ' -0.01\t' },
    })[0]).toMatchObject({ net: '-1.23', tax: '-0.01', gross: '-1.24' });
  });

  it('uses declared one-cent VAT rather than recalculating it from the rate', () => {
    // A PDF renderer must preserve supplied summary values, including values
    // that differ from a fresh rate multiplication or line-by-line rounding.
    expect(summary({
      P_13_1: { _text: '0.01' },
      P_14_1: { _text: '0.01' },
    })[0]).toMatchObject({ net: '0.01', tax: '0.01', gross: '0.02' });
  });

  it('formats the standalone OSS tax amount with a decimal comma', () => {
    const content = vat({ Fa: { P_14_5: { _text: '1234.56' } } });
    expect(textNodes(content)).toMatch(/1[\u00a0 ]234,56/);
    expect(textNodes(content)).not.toContain('1234.56');
  });
});

it('renders whitespace-wrapped negative cents correctly through the public XML API', async () => {
  const fixture = readFileSync('test/fixtures/invoice-fa2.xml', 'utf8');
  const xml = fixture
    .replace(/<P_13_1>[^<]*<\/P_13_1>/, '<P_13_1>\n -1.23 </P_13_1>')
    .replace(/<P_14_1>[^<]*<\/P_14_1>/, '<P_14_1> -0.01\t</P_14_1>')
    .replace(/<P_15>[^<]*<\/P_15>/, '<P_15>-1.24</P_15>');
  const createPdf = vi.spyOn(pdfMake, 'createPdf');
  const bytes = await renderPdfFromXml(xml);
  expect(Buffer.from(bytes).subarray(0, 4).toString()).toBe('%PDF');
  const summaryRow = tableRows(createPdf.mock.calls[0][0].content)
    .find((row) => textNodes(row).includes('23% lub 22%'));
  expect(summaryRow).toBeDefined();
  expect(textNodes(summaryRow)).toContain('-1,23');
  expect(textNodes(summaryRow)).toContain('-0,01');
  expect(textNodes(summaryRow)).toContain('-1,24');
  expect(textNodes(summaryRow)).not.toContain('-0,77');
});

describe('previously omitted invoice details', () => {
  it.each([
    ['FA(1)', fa1Transport, { AdresPol: { Ulica: { _text: 'Punkt pośredni Łódź' } } }],
    ['FA(2)', fa2Transport, { KodKraju: { _text: 'PL' }, AdresL1: { _text: 'Punkt pośredni Łódź' } }],
    ['FA(3)', fa3Transport, { KodKraju: { _text: 'PL' }, AdresL1: { _text: 'Punkt pośredni Łódź' } }],
  ] as const)('%s shows a single intermediate address without from/to addresses', (_version, transport, address) => {
    expect(textNodes(transport({ WysylkaPrzez: address } as any))).toContain('Punkt pośredni Łódź');
  });

  it('shows FA(3) corrected-buyer customer number and JST/GV without contact details', () => {
    const content = generatePodmiot2Podmiot2K({
      NrKlienta: { _text: 'CLIENT-123' },
      JST: { _text: '1' },
      GV: { _text: '2' },
    }, { DaneIdentyfikacyjne: { Nazwa: { _text: 'Nabywca przed korektą' } } });
    const text = textNodes(content);
    expect(text).toContain('CLIENT-123');
    expect(text).toMatch(/Faktura dotyczy jednostki podrzędnej JST:\s+TAK/);
    expect(text).toMatch(/Faktura dotyczy członka grupy GV:\s+NIE/);
  });

  const correctiveInvoice = {
    CreditNoteTypeCode: { _text: '381' },
    ProfileID: { _text: 'urn:fdc:www.efaktura.gov.pl:ver2.0:corr_inv:ver4.0' },
  };

  it('uses a dash for a missing PEF corrective payable amount', () => {
    const text = textNodes(generateInvoiceHeader(correctiveInvoice as any, 'KSEF-TEST'));
    expect(text).toContain('Kwota do zapłaty -');
    expect(text).not.toContain('undefined');
  });

  it.each([SectionType.BeforeCorrection, SectionType.AfterCorrection, SectionType.Summary])(
    'omits missing PEF corrective totals in section %s', (section) => {
      expect(generateLegalMonetaryTotal(correctiveInvoice as any, section)).toEqual([]);
    },
  );

  it.each([
    ['before-correction', 0],
    ['difference', 1],
    ['after-correction', 2],
    ['all', -1],
  ] as const)('renders PEF corrective XML with %s totals absent but extensions present', async (_name, missingIndex) => {
    const fixture = readFileSync('test/fixtures/invoice-pef-corrective.xml', 'utf8');
    let index = 0;
    const xml = fixture.replace(/<cac:LegalMonetaryTotal>[\s\S]*?<\/cac:LegalMonetaryTotal>/g, (total) => {
      const currentIndex = index++;
      return missingIndex === -1 || currentIndex === missingIndex ? '' : total;
    });
    expect(index).toBe(3);
    // Keep the enclosing extensions: absent InvoiceCorrection and a present
    // InvoiceCorrection with no LegalMonetaryTotal take different code paths.
    expect(xml).toContain('<pl:OriginalInvoiceData>');
    expect(xml).toContain('<pl:InvoiceCorrection>');

    const createPdf = vi.spyOn(pdfMake, 'createPdf');
    const bytes = await renderPdfFromXml(xml, { nrKSeF: 'PEF-PARTIAL-TOTALS' });
    expect(Buffer.from(bytes).subarray(0, 4).toString()).toBe('%PDF');
    const text = textNodes(createPdf.mock.calls[0][0].content).replace(/\u00a0/g, ' ');
    expect(text).toContain('PEF-corrective/2026/001');
    expect(text).toContain('PEF-PARTIAL-TOTALS');
    expect(text).not.toContain('undefined');
    if (missingIndex === -1 || missingIndex === 1) {
      expect(text).toContain('Kwota do zapłaty -');
    } else {
      expect(text).toContain('-246,00');
    }
    if (missingIndex !== -1 && missingIndex !== 0) expect(text).toContain('1 230,00');
    if (missingIndex !== -1 && missingIndex !== 2) expect(text).toContain('984,00');
  });

  it.each([
    ['PEF-basic/2026/001', 'PEF-basic/2026/001'],
    ['PEF/Łódź &amp; &lt;test&gt;', 'PEF/Łódź & <test>'],
  ])('prints the dated PEF invoice reference %s as plain PDF text', async (xmlId, printedId) => {
    const xml = readFileSync('test/fixtures/invoice-pef-corrective.xml', 'utf8')
      .replace('<cbc:ID>PEF-basic/2026/001</cbc:ID>', `<cbc:ID>${xmlId}</cbc:ID>`);
    const createPdf = vi.spyOn(pdfMake, 'createPdf');
    const bytes = await renderPdfFromXml(xml);
    expect(Buffer.from(bytes).subarray(0, 4).toString()).toBe('%PDF');
    const text = textNodes(createPdf.mock.calls[0][0].content);
    expect(text).toContain(`${printedId} z dn. 20.09.2026`);
    expect(text).not.toMatch(/&#x2F;|&amp;|&lt;|&gt;/);
  });
});

describe('invoice formatting', () => {
  it('collapses whitespace inside the invoice number', () => {
    const content = generateNaglowek({ P_2: { _text: '\n  FV/2026/\t 001  ' } });
    expect(content[2]).toMatchObject({ text: 'FV/2026/ 001' });
  });

  it.each([fa1Discount, fa2Discount, fa3Discount])('uses a decimal comma for collective-correction quantities', (discount) => {
    const rows = [{ NrWierszaFa: { _text: '1' }, P_8B: { _text: '1.25' } }];
    const content = discount(discount === fa1Discount
      ? { FaWiersze: { FaWiersz: rows } }
      : { FaWiersz: rows });
    expect(textNodes(content)).toContain('1,25');
    expect(textNodes(content)).not.toContain('1.25');
  });

  it.each(['DoZaplaty', 'DoRozliczenia'])('groups thousands in settlement field %s', (field) => {
    const text = textNodes(generateRozliczenie({ [field]: { _text: '1234.56' } }, 'PLN'));
    expect(text).toMatch(/1[\u00a0 ]234,56 PLN/);
  });
});
