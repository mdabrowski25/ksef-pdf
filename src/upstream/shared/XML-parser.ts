// @ts-nocheck
import { xml2js } from 'xml-js';

export type XmlInput = string | ArrayBuffer | Uint8Array | Blob | File;

export function stripPrefixes<T>(obj: T): T {
  if (Array.isArray(obj)) {
    return obj.map(stripPrefixes) as T;
  } else if (typeof obj === 'object' && obj !== null) {
    return Object.fromEntries(
      Object.entries(obj).map(([key, value]: [string, T]): [string, T] => [
        key.includes(':') ? key.split(':')[1] : key,
        stripPrefixes(value),
      ])
    ) as T;
  }
  return obj;
}

function parseXMLString(xmlStr: string): unknown {
  return stripPrefixes(xml2js(xmlStr, { compact: true }));
}

export async function parseXML(input: XmlInput): Promise<unknown> {
  if (typeof input === 'string') {
    return parseXMLString(input);
  }

  if (input instanceof Uint8Array) {
    return parseXMLString(new TextDecoder().decode(input));
  }

  if (input instanceof ArrayBuffer) {
    return parseXMLString(new TextDecoder().decode(new Uint8Array(input)));
  }

  if (typeof Blob !== 'undefined' && input instanceof Blob) {
    return parseXMLString(await input.text());
  }

  throw new Error('Unsupported XML input type.');
}


