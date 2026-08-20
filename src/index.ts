import pdfMake from 'pdfmake/build/pdfmake.js';
import pdfFonts from 'pdfmake/build/vfs_fonts.js';
import type { TCreatedPdf } from 'pdfmake/build/pdfmake.js';
import type { TDocumentDefinitions } from 'pdfmake/interfaces';
import { xml2js } from 'xml-js';
import { generateFA1 } from './upstream/lib-public/FA1-generator';
import { generateFA2 } from './upstream/lib-public/FA2-generator';
import { generateFA3 } from './upstream/lib-public/FA3-generator';
import { generateFARR } from './upstream/lib-public/FARR-generator';
import { configureFonts } from './upstream/lib-public/configure-fonts';
import type { FontConfig } from './upstream/lib-public/configure-fonts';
import { i18nReady } from './upstream/lib-public/i18n/i18n-init';
import { generateDokumentUPO as generateDokumentUpoV42 } from './upstream/lib-public/generators/UPO4_2/Dokumenty';
import { generateNaglowekUPO as generateNaglowekUpoV42 } from './upstream/lib-public/generators/UPO4_2/Naglowek';
import { generateDokumentUPO as generateDokumentUpoV43 } from './upstream/lib-public/generators/UPO4_3/Dokumenty';
import { generateNaglowekUPO as generateNaglowekUpoV43 } from './upstream/lib-public/generators/UPO4_3/Naglowek';
import type { AdditionalDataTypes } from './upstream/lib-public/types/common.types';
import type { Faktura as Faktura1 } from './upstream/lib-public/types/fa1.types';
import type { Faktura as Faktura2 } from './upstream/lib-public/types/fa2.types';
import type { Faktura as Faktura3 } from './upstream/lib-public/types/fa3.types';
import type { FaRR } from './upstream/lib-public/types/FaRR.types';
import type { Upo as UpoV42 } from './upstream/lib-public/types/upo-v4_2.types';
import { generateStyle } from './upstream/shared/PDF-functions';
import { Position } from './upstream/shared/enums/common.enum';

const pdfMakeRuntime = pdfMake as typeof pdfMake & {
  localAccessPolicy?: (path: string) => boolean;
  urlAccessPolicy?: (url: string) => boolean;
  setLocalAccessPolicy?: (policy: (path: string) => boolean) => void;
  setUrlAccessPolicy?: (policy: (url: string) => boolean) => void;
};

pdfMakeRuntime.addVirtualFileSystem(pdfFonts);
const denyLocalResource = () => false;
const denyRemoteResource = () => false;

if (pdfMakeRuntime.setLocalAccessPolicy) {
  pdfMakeRuntime.setLocalAccessPolicy(denyLocalResource);
} else {
  pdfMakeRuntime.localAccessPolicy = denyLocalResource;
}

if (pdfMakeRuntime.setUrlAccessPolicy) {
  pdfMakeRuntime.setUrlAccessPolicy(denyRemoteResource);
} else {
  pdfMakeRuntime.urlAccessPolicy = denyRemoteResource;
}

export type XmlInput = string | ArrayBuffer | Uint8Array | Blob | File;
export type KsefInvoiceVersion = 'FA(1)' | 'FA(2)' | 'FA(3)' | 'FA_RR(1)';
export type KsefUpoVersion = 'UPO(4.2)' | 'UPO(4.3)';

export interface RenderInvoiceOptions {
  nrKSeF?: string;
  qrCode?: string;
  qr2Code?: string;
  ksefAcquisitionDate?: string | Date;
}

export function detectInvoiceVersion(xml: string): KsefInvoiceVersion | null {
  const match = xml.match(
    /KodFormularza[^>]*kodSystemowy\s*=\s*['"](FA(?:_RR)?\s*\(\s*[123]\s*\))['"]/i,
  );
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

export async function renderPdfFromXml(
  xml: XmlInput,
  options: RenderInvoiceOptions = {},
): Promise<Uint8Array> {
  const parsed = await parseXmlInput(xml);
  const invoice = getInvoiceRoot(parsed);
  const version = normalizeInvoiceVersion(
    invoice?.Naglowek?.KodFormularza?._attributes?.kodSystemowy,
  );

  if (!version) {
    throw new Error('Unsupported or missing invoice version. Expected FA(1), FA(2), FA(3), or FA_RR(1).');
  }

  await i18nReady;

  const additionalData: AdditionalDataTypes = {
    nrKSeF: options.nrKSeF ?? '',
    qrCode: options.qrCode,
    qr2Code: options.qr2Code,
    acDate: formatAcquisitionDate(options.ksefAcquisitionDate),
    isMobile: false,
  };

  return toUint8Array(createInvoicePdf(invoice, version, additionalData));
}

export async function renderPdfBase64FromXml(
  xml: XmlInput,
  options: RenderInvoiceOptions = {},
): Promise<string> {
  const pdf = await renderPdfFromXml(xml, options);
  return Buffer.from(pdf).toString('base64');
}

export async function renderUpoPdfFromXml(xml: XmlInput): Promise<Uint8Array> {
  const rawXml = await xmlInputToString(xml);
  const parsed = (await parseXmlInput(rawXml)) as UpoV42;
  const potwierdzenie = parsed?.Potwierdzenie;

  if (!potwierdzenie) {
    throw new Error('Invalid UPO XML: missing Potwierdzenie node.');
  }

  await i18nReady;

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
    footer: createPageFooter,
  };

  return toUint8Array(pdfMakeRuntime.createPdf(docDefinition));
}

export async function generateInvoice(
  file: XmlInput,
  additionalData: AdditionalDataTypes,
  formatType: 'blob',
): Promise<Blob>;
export async function generateInvoice(
  file: XmlInput,
  additionalData: AdditionalDataTypes,
  formatType: 'base64',
): Promise<string>;
export async function generateInvoice(
  file: XmlInput,
  additionalData: AdditionalDataTypes,
  formatType: 'uint8array',
): Promise<Uint8Array>;
export async function generateInvoice(
  file: XmlInput,
  additionalData: AdditionalDataTypes,
  formatType: 'blob' | 'base64' | 'uint8array' = 'blob',
): Promise<Blob | string | Uint8Array> {
  const parsed = await parseXmlInput(file);
  const invoice = getInvoiceRoot(parsed);
  const version = normalizeInvoiceVersion(
    invoice?.Naglowek?.KodFormularza?._attributes?.kodSystemowy,
  );

  if (!version) {
    throw new Error(`Unsupported invoice version: ${String(invoice?.Naglowek?.KodFormularza?._attributes?.kodSystemowy)}`);
  }

  await i18nReady;
  const pdf = createInvoicePdf(invoice, version, additionalData);

  if (formatType === 'blob') {
    return pdf.getBlob();
  }
  if (formatType === 'base64') {
    return pdf.getBase64();
  }
  return toUint8Array(pdf);
}

export async function generatePDFUPO(file: XmlInput, formatType: 'blob'): Promise<Blob>;
export async function generatePDFUPO(file: XmlInput, formatType?: 'uint8array'): Promise<Uint8Array>;
export async function generatePDFUPO(
  file: XmlInput,
  formatType: 'blob' | 'uint8array' = 'uint8array',
): Promise<Blob | Uint8Array> {
  const bytes = await renderUpoPdfFromXml(file);
  const blobPart = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
  return formatType === 'blob' ? new Blob([blobPart], { type: 'application/pdf' }) : bytes;
}

function createInvoicePdf(
  invoice: Record<string, any>,
  version: KsefInvoiceVersion,
  additionalData: AdditionalDataTypes,
): TCreatedPdf {
  switch (version) {
    case 'FA(1)':
      return generateFA1(invoice as Faktura1, additionalData);
    case 'FA(2)':
      return generateFA2(invoice as Faktura2, additionalData);
    case 'FA(3)':
      return generateFA3(invoice as Faktura3, additionalData);
    case 'FA_RR(1)':
      return generateFARR(invoice as FaRR, additionalData);
  }
}

function normalizeInvoiceVersion(versionValue: unknown): KsefInvoiceVersion | null {
  if (typeof versionValue !== 'string') {
    return null;
  }

  const normalized = versionValue.replace(/\s+/g, '').toUpperCase();
  const faMatch = normalized.match(/^FA\(([123])\)$/);
  if (faMatch) {
    return `FA(${faMatch[1]})` as KsefInvoiceVersion;
  }

  return normalized === 'FA_RR(1)' ? 'FA_RR(1)' : null;
}

function getInvoiceRoot(parsed: any): Record<string, any> {
  const invoice = parsed?.Faktura ?? parsed?.FakturaRR;
  if (!invoice) {
    throw new Error('Invalid invoice XML: missing Faktura root node.');
  }
  return invoice;
}

async function parseXmlInput(input: XmlInput): Promise<any> {
  const xml = await xmlInputToString(input);
  return stripPrefixes(xml2js(xml, { compact: true }));
}

function stripPrefixes(value: any): any {
  if (Array.isArray(value)) {
    return value.map(stripPrefixes);
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, child]) => [
        key.includes(':') ? key.slice(key.indexOf(':') + 1) : key,
        stripPrefixes(child),
      ]),
    );
  }
  return value;
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

function formatAcquisitionDate(value?: string | Date): string | undefined {
  if (!value) {
    return undefined;
  }

  const raw = value instanceof Date ? value.toISOString() : value;
  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    return `${match[3]}.${match[2]}.${match[1]}`;
  }
  return raw;
}

async function toUint8Array(createdPdf: TCreatedPdf): Promise<Uint8Array> {
  const buffer = await createdPdf.getBuffer();
  return new Uint8Array(buffer);
}

function createPageFooter(currentPage: number, pageCount: number) {
  return {
    text: `${currentPage} z ${pageCount}`,
    alignment: Position.RIGHT,
    margin: [0, 0, 20, 0] as [number, number, number, number],
  };
}

export type { AdditionalDataTypes, FontConfig };
export { configureFonts, generateFA1, generateFA2, generateFA3, generateFARR };
