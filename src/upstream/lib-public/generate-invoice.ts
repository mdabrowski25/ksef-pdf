// @ts-nocheck
import { generateFA1 } from './FA1-generator';
import { Faktura as Faktura1 } from './types/fa1.types';
import { generateFA2 } from './FA2-generator';
import { Faktura as Faktura2 } from './types/fa2.types';
import { generateFA3 } from './FA3-generator';
import { Faktura as Faktura3 } from './types/fa3.types';
import { parseXML, XmlInput } from '../shared/XML-parser';
import type { TCreatedPdf } from 'pdfmake/build/pdfmake.js';
import { AdditionalDataTypes } from './types/common.types';

export async function generateInvoice(
  file: XmlInput,
  additionalData: AdditionalDataTypes,
  formatType: 'blob'
): Promise<Blob>;
export async function generateInvoice(
  file: XmlInput,
  additionalData: AdditionalDataTypes,
  formatType: 'base64'
): Promise<string>;
export async function generateInvoice(
  file: XmlInput,
  additionalData: AdditionalDataTypes,
  formatType: 'uint8array'
): Promise<Uint8Array>;
export async function generateInvoice(
  file: XmlInput,
  additionalData: AdditionalDataTypes,
  formatType: FormatType = 'blob'
): Promise<FormatTypeResult> {
  const xml: unknown = await parseXML(file);
  const wersja: any = (xml as any)?.Faktura?.Naglowek?.KodFormularza?._attributes?.kodSystemowy;

  let pdf: TCreatedPdf | undefined;

  return new Promise((resolve, reject): void => {
    switch (wersja) {
      case 'FA (1)':
        pdf = generateFA1((xml as any).Faktura as Faktura1, additionalData);
        break;
      case 'FA (2)':
        pdf = generateFA2((xml as any).Faktura as Faktura2, additionalData);
        break;
      case 'FA (3)':
        pdf = generateFA3((xml as any).Faktura as Faktura3, additionalData);
        break;
      default:
        reject(new Error(`Unsupported invoice version: ${String(wersja)}`));
        return;
    }

    switch (formatType) {
      case 'blob':
        pdf.getBlob((blob: Blob): void => {
          resolve(blob);
        });
        break;
      case 'uint8array':
        pdf.getBuffer((buffer: Uint8Array): void => {
          resolve(new Uint8Array(buffer));
        });
        break;
      case 'base64':
      default:
        pdf.getBase64((base64: string): void => {
          resolve(base64);
        });
    }
  });
}

type FormatType = 'blob' | 'base64' | 'uint8array';
type FormatTypeResult = Blob | string | Uint8Array;


