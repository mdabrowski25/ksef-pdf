// @ts-nocheck
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import { Upo } from './types/upo-v4_2.types';
import { TDocumentDefinitions } from 'pdfmake/interfaces';
import { generateStyle } from '../shared/PDF-functions';
import { parseXML, XmlInput } from '../shared/XML-parser';
import { Position } from '../shared/enums/common.enum';
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
    footer: function (currentPage: number, pageCount: number) {
      return {
        text: currentPage.toString() + ' z ' + pageCount,
        alignment: Position.RIGHT,
        margin: [0, 0, 20, 0],
      };
    },
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


