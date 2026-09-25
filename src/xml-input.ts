export type XmlInput = string | ArrayBuffer | Uint8Array | Blob | File;

/** Decode XML before parsing; Blob.text() always uses UTF-8 and loses UTF-16 data. */
export async function xmlInputToString(input: XmlInput): Promise<string> {
  if (typeof input === 'string') {
    return input;
  }

  let bytes: Uint8Array;
  if (input instanceof Uint8Array) {
    bytes = input;
  } else if (input instanceof ArrayBuffer) {
    bytes = new Uint8Array(input);
  } else if (typeof Blob !== 'undefined' && input instanceof Blob) {
    const buffer = typeof input.arrayBuffer === 'function'
      ? await input.arrayBuffer()
      : await new Promise<ArrayBuffer>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as ArrayBuffer);
          reader.onerror = () => reject(reader.error ?? new Error('Unable to read XML input.'));
          reader.onabort = () => reject(new Error('XML input read aborted.'));
          reader.readAsArrayBuffer(input);
        });
    bytes = new Uint8Array(buffer);
  } else {
    throw new Error('Unsupported XML input type.');
  }

  let encoding = 'utf-8';
  if ((bytes[0] === 0xff && bytes[1] === 0xfe) || (bytes[0] === 0x3c && bytes[1] === 0x00)) {
    encoding = 'utf-16le';
  } else if ((bytes[0] === 0xfe && bytes[1] === 0xff) || (bytes[0] === 0x00 && bytes[1] === 0x3c)) {
    encoding = 'utf-16be';
  }
  return new TextDecoder(encoding).decode(bytes);
}
