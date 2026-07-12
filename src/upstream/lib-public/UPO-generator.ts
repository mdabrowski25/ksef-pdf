// @ts-nocheck
import pdfMake from 'pdfmake/build/pdfmake.js';
import pdfFonts from 'pdfmake/build/vfs_fonts.js';
import { Upo } from './types/upo-v4_2.types';
import { TDocumentDefinitions } from 'pdfmake/interfaces';
import { generatePageFooter, generateStyle } from '../shared/PDF-functions';
import { parseXML, XmlInput } from '../shared/XML-parser';
import { generateDokumentUPO } from './generators/UPO4_3/Dokumenty';
import { generateNaglowekUPO } from './generators/UPO4_3/Naglowek';

pdfMake.vfs = pdfFonts.vfs;

export async function generatePDFUPO(file: XmlInput, formatType: 'blob'): Promise<Blob>;
export async function generatePDFUPO(file: XmlInput, formatType?: 'uint8array'): Promise<Uint8Array>;
export async function generatePDFUPO(
  file: XmlInput,
  formatType: 'blob' | 'uint8array' = 'uint8array'
): Promise<Blob | Uint8Array> {
  const upo = (await parseXML(file)) as Upo;
  const docDefinition: TDocumentDefinitions = {
    content: [generateNaglowekUPO(upo.Potwierdzenie!), generateDokumentUPO(upo.Potwierdzenie!)],
    ...generateStyle(),
    pageSize: 'A4',
    pageOrientation: 'landscape',
    footer: generatePageFooter,
  };

  return new Promise((resolve, reject): void => {
    const generated = pdfMake.createPdf(docDefinition);

    if (formatType === 'blob') {
      generated.getBlob((blob: Blob): void => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to render UPO PDF as Blob.'));
        }
      });
      return;
    }

    generated.getBuffer((buffer: Uint8Array): void => {
      if (buffer) {
        resolve(new Uint8Array(buffer));
      } else {
        reject(new Error('Failed to render UPO PDF as bytes.'));
      }
    });
  });
}


