import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import { TCreatedPdf } from 'pdfmake/build/pdfmake';
import { TDocumentDefinitions } from 'pdfmake/interfaces';
import { generateFA1 } from './upstream/lib-public/FA1-generator';
import { generateFA2 } from './upstream/lib-public/FA2-generator';
import { generateFA3 } from './upstream/lib-public/FA3-generator';
import { generateDokumnetUPO as generateDokumentUpoV42 } from './upstream/lib-public/generators/UPO4_2/Dokumenty';
import { generateNaglowekUPO as generateNaglowekUpoV42 } from './upstream/lib-public/generators/UPO4_2/Naglowek';
import { generateDokumentUPO as generateDokumentUpoV43 } from './upstream/lib-public/generators/UPO4_3/Dokumenty';
import { generateNaglowekUPO as generateNaglowekUpoV43 } from './upstream/lib-public/generators/UPO4_3/Naglowek';
import { AdditionalDataTypes } from './upstream/lib-public/types/common.types';
import { Faktura as Faktura1 } from './upstream/lib-public/types/fa1.types';
import { Faktura as Faktura2 } from './upstream/lib-public/types/fa2.types';
import { Faktura as Faktura3 } from './upstream/lib-public/types/fa3.types';
import { Upo } from './upstream/lib-public/types/upo-v4_2.types';
import { Position } from './upstream/shared/enums/common.enum';
import { generateStyle } from './upstream/shared/PDF-functions';
import { parseXML, XmlInput } from './upstream/shared/XML-parser';
import { generateInvoice } from './upstream/lib-public/generate-invoice';
import { generatePDFUPO } from './upstream/lib-public/UPO-generator';

(pdfMake as any).vfs = (pdfFonts as any).vfs;

export type KsefInvoiceVersion = 'FA(1)' | 'FA(2)' | 'FA(3)';
export type KsefUpoVersion = 'UPO(4.2)' | 'UPO(4.3)';

export function detectInvoiceVersion(xml: string): KsefInvoiceVersion | null {
  const match = xml.match(/KodFormularza[^>]*kodSystemowy\s*=\s*['"](FA\s*\([123]\))['"]/i);
  return normalizeInvoiceVersion(match?.[1]);
}

export function detectUpoVersion(xml: string): KsefUpoVersion | null {
  if (/KSeF\/v4-3/i.test(xml) || /wersjaSchemy\s*=\s*['"]4[-_.]?3/i.test(xml)) {
    return 'UPO(4.3)';
  }

  if (/KSeF\/v4-2/i.test(xml) || /wersjaSchemy\s*=\s*['"]4[-_.]?2/i.test(xml)) {
    return 'UPO(4.2)';
  }

  return null;
}

export async function renderPdfFromXml(xml: XmlInput): Promise<Uint8Array> {
  const parsed = (await parseXML(xml)) as any;
  const version = normalizeInvoiceVersion(
    (parsed as any)?.Faktura?.Naglowek?.KodFormularza?._attributes?.kodSystemowy
  );

  if (!version) {
    throw new Error('Unsupported or missing invoice version. Expected FA(1), FA(2), or FA(3).');
  }

  const additionalData: AdditionalDataTypes = {
    nrKSeF: '',
  };

  let createdPdf: TCreatedPdf;

  switch (version) {
    case 'FA(1)':
      createdPdf = generateFA1(parsed.Faktura as Faktura1, additionalData);
      break;
    case 'FA(2)':
      createdPdf = generateFA2(parsed.Faktura as Faktura2, additionalData);
      break;
    case 'FA(3)':
      createdPdf = generateFA3(parsed.Faktura as Faktura3, additionalData);
      break;
  }

  return toUint8Array(createdPdf);
}

export async function renderUpoPdfFromXml(xml: XmlInput): Promise<Uint8Array> {
  const rawXml = await xmlInputToString(xml);
  const parsed = (await parseXML(rawXml)) as Upo;
  const potwierdzenie = parsed?.Potwierdzenie;

  if (!potwierdzenie) {
    throw new Error('Invalid UPO XML: missing Potwierdzenie node.');
  }

  const upoVersion = detectUpoVersion(rawXml) ?? 'UPO(4.3)';

  const content =
    upoVersion === 'UPO(4.2)'
      ? [...generateNaglowekUpoV42(potwierdzenie), ...generateDokumentUpoV42(potwierdzenie)]
      : [...generateNaglowekUpoV43(potwierdzenie), ...generateDokumentUpoV43(potwierdzenie)];

  const docDefinition: TDocumentDefinitions = {
    content,
    ...generateStyle(),
    pageSize: 'A4',
    pageOrientation: 'landscape',
    footer(currentPage: number, pageCount: number) {
      return {
        text: `${currentPage} z ${pageCount}`,
        alignment: Position.RIGHT,
        margin: [0, 0, 20, 0],
      };
    },
  };

  return toUint8Array(pdfMake.createPdf(docDefinition));
}

export async function renderPdfBase64FromXml(xml: XmlInput): Promise<string> {
  const pdf = await renderPdfFromXml(xml);
  return Buffer.from(pdf).toString('base64');
}

function normalizeInvoiceVersion(versionValue: unknown): KsefInvoiceVersion | null {
  if (typeof versionValue !== 'string') {
    return null;
  }

  const normalized = versionValue.replace(/\s+/g, ' ').trim();
  const match = normalized.match(/^FA\s*\((1|2|3)\)$/i);

  if (!match) {
    return null;
  }

  return `FA(${match[1]})` as KsefInvoiceVersion;
}

async function xmlInputToString(xml: XmlInput): Promise<string> {
  if (typeof xml === 'string') {
    return xml;
  }

  if (xml instanceof Uint8Array) {
    return new TextDecoder().decode(xml);
  }

  if (xml instanceof ArrayBuffer) {
    return new TextDecoder().decode(new Uint8Array(xml));
  }

  if (typeof Blob !== 'undefined' && xml instanceof Blob) {
    return xml.text();
  }

  throw new Error('Unsupported XML input type.');
}

function toUint8Array(createdPdf: TCreatedPdf): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    try {
      (createdPdf as any).getBuffer((buffer: Uint8Array) => {
        resolve(new Uint8Array(buffer));
      });
    } catch (error) {
      reject(error);
    }
  });
}

export type { XmlInput };
export { generateInvoice, generatePDFUPO, generateFA1, generateFA2, generateFA3 };
