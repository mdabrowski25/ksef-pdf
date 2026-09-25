import { xml2js } from 'xml-js';
import { xmlInputToString } from '../../xml-input';

export function stripPrefix(key: string): string {
  return key.includes(':') ? key.split(':')[1] : key;
}

export async function parseXML(file: File): Promise<unknown> {
  return xml2js(await xmlInputToString(file), {
    compact: true,
    cdataKey: '_text',
    trim: true,
    elementNameFn: stripPrefix,
    attributeNameFn: stripPrefix,
  });
}
