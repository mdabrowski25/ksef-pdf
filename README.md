# @mdab25/ksef-pdf

Generate PDF files from Polish KSeF invoice and UPO XML in **Node.js 22+**.
Supports ES modules, CommonJS, and TypeScript, with Polish labels by default.

The package renders XML you already have. Your application supplies the XML,
KSeF metadata, and verification URLs; this package does not submit invoices,
authenticate with KSeF, or validate documents against the official XSD schemas.

## Quickstart: XML to PDF

```bash
npm install @mdab25/ksef-pdf
```

Save a supported invoice as `invoice.xml` in your working directory. To try the
package, you can use this [synthetic FA(3) sample](https://raw.githubusercontent.com/mdabrowski25/ksef-pdf/v1.1.0/test/fixtures/invoice-fa2.xml).
Save the download as `invoice.xml`; its historical filename says FA2, but the
XML declares the FA(3) schema.

Create **`render-invoice.mjs`**:

```js
import { readFile, writeFile } from 'node:fs/promises';
import { renderPdfFromXml } from '@mdab25/ksef-pdf';

const xml = await readFile('./invoice.xml');
const pdf = await renderPdfFromXml(xml);

await writeFile('./invoice.pdf', pdf);
```

Run it from the directory containing your XML file:

```bash
node render-invoice.mjs
```

This creates `invoice.pdf`. No fonts, KSeF number, or QR options are needed for
basic rendering. The `.mjs` extension enables ES modules and top-level `await`.
The XML input is file contents, not a filename or URL.

Keep `readFile` in binary mode as shown: the package detects UTF-8 and UTF-16
itself. Adding `'utf8'` would decode a UTF-16 file incorrectly before rendering.

## Contents

- [Supported documents](#supported-documents)
- [CommonJS, UPO, and Base64 examples](#common-recipes)
- [API and inputs](#api-reference)
- [KSeF metadata and QR codes](#ksef-metadata-and-qr-codes)
- [PEF invoices](#pef-invoices)
- [Custom fonts](#custom-fonts)
- [Compatibility and low-level APIs](#compatibility-and-low-level-apis)
- [Troubleshooting](#troubleshooting)
- [Support / Services](#support--services)
- [Release information](#release-information)

## Supported documents

| Document | Rendering entry point |
|---|---|
| FA(1), FA(2), FA(3), FA_RR(1) | `renderPdfFromXml` |
| PEF basic, corrective, specialized | `renderPdfFromXml` |
| UPO(4.2), UPO(4.3) | `renderUpoPdfFromXml` |

Invoice layouts cover VAT, advance, settlement, simplified, corrective,
collective-corrective, foreign-currency, multi-rate, and attachment-bearing
invoices represented by the supported schemas. This package adapts the public
[CIRFMF renderer](https://github.com/CIRFMF/ksef-pdf-generator) for Node.js.
A successfully generated PDF does not establish that its source XML is valid
for submission to KSeF.

## Common recipes

### CommonJS

Create **`render-invoice.cjs`**, then run `node render-invoice.cjs`:

```js
const { readFile, writeFile } = require('node:fs/promises');
const { renderPdfFromXml } = require('@mdab25/ksef-pdf');

async function main() {
  const xml = await readFile('./invoice.xml');
  const pdf = await renderPdfFromXml(xml);
  await writeFile('./invoice.pdf', pdf);
}

main().catch((error) => {
  console.error('Could not render invoice:', error.message);
  process.exitCode = 1;
});
```

### UPO receipt

A UPO is the XML receipt confirming document delivery to KSeF. Save it as
`upo.xml`. Create **`render-upo.mjs`**, then run `node render-upo.mjs`:

```js
import { readFile, writeFile } from 'node:fs/promises';
import { renderUpoPdfFromXml } from '@mdab25/ksef-pdf';

const xml = await readFile('./upo.xml');
const pdf = await renderUpoPdfFromXml(xml);

await writeFile('./upo.pdf', pdf);
```

UPO output uses landscape A4 pages. The renderer selects 4.2 or 4.3 from the XML;
if it cannot identify the version, it currently uses the 4.3 layout. Use
`detectUpoVersion` first if your application must reject an unidentified version.

### Base64 output

Create **`render-base64.mjs`**, then run `node render-base64.mjs`:

```js
import { readFile, writeFile } from 'node:fs/promises';
import { renderPdfBase64FromXml } from '@mdab25/ksef-pdf';

const xml = await readFile('./invoice.xml');
const base64 = await renderPdfBase64FromXml(xml);

await writeFile('./invoice.base64.txt', base64, 'utf8');
```

The result is plain Base64, without a `data:application/pdf;base64,` prefix.
Prefer PDF bytes when writing a PDF file or returning an HTTP response. For an
HTTP download, set `Content-Type: application/pdf` and send the bytes unchanged.

## API reference

### Main functions

| Function | Result | Purpose |
|---|---|---|
| `renderPdfFromXml(xml, options?)` | `Promise<Uint8Array>` | Render any supported invoice; format is detected automatically. |
| `renderPdfBase64FromXml(xml, options?)` | `Promise<string>` | Render an invoice as plain Base64. |
| `renderUpoPdfFromXml(xml)` | `Promise<Uint8Array>` | Render a UPO receipt. |
| `detectInvoiceVersion(xmlText)` | `KsefInvoiceVersion \| null` | Identify FA(1), FA(2), FA(3), or FA_RR(1). Returns `null` for PEF. |
| `detectPefInvoiceVersion(xmlText)` | `PefInvoiceVersion \| null` | Identify the PEF profile; throws if XML parsing fails. |
| `detectUpoVersion(xmlText)` | `KsefUpoVersion \| null` | Identify UPO(4.2) or UPO(4.3). |
| `configureFonts(config)` | `void` | Register virtual fonts and select the process-wide default family. |

The `detect*` helpers take a **decoded XML string**, not binary input. They
identify formats; they do not validate the complete invoice. Rendering normally
handles detection for you.

TypeScript declarations are included. Import types from the package root:

```ts
import type { XmlInput, RenderInvoiceOptions } from '@mdab25/ksef-pdf';
```

The root also exports `KsefInvoiceVersion`, `PefInvoiceVersion`, `KsefUpoVersion`,
`FontConfig`, and `AdditionalDataTypes`.

### XML input

The three `render*` functions, `generateInvoice`, and `generatePDFUPO` accept
`XmlInput`:

| Input | Notes |
|---|---|
| `string` | Already-decoded XML text. A path such as `'invoice.xml'` is not read from disk. |
| `Uint8Array` or Node.js `Buffer` | XML bytes; recommended for `readFile` and HTTP response bodies. |
| `ArrayBuffer` | XML bytes. |
| `Blob` or `File` | Native Node.js objects containing XML. |

Byte inputs support UTF-8 and UTF-16 LE/BE. UTF-16 is detected by a byte-order
mark (BOM), or by its opening `<` bytes when there is no BOM. Other encodings
must be decoded by your application before passing an XML string.

The supported runtime is Node.js 22+. Accepting `Blob` and `File` does not imply
a supported browser build. The package has no built-in command-line executable;
the quickstart creates a small Node.js script that calls the library.

### Errors

Rendering returns a rejected Promise for malformed XML, an unsupported invoice
schema/profile, a missing document root, or a PDF-generation failure. Catch
errors at your application boundary, as in the CommonJS example. Error messages
are diagnostic text, not stable error codes.

## KSeF metadata and QR codes

The second argument to either invoice `render*` function is optional. These
fields describe an invoice your application has already obtained or prepared:

| Option | Type | Default and behavior |
|---|---|---|
| `nrKSeF` | `string` | Empty; the KSeF number is omitted. Supply the actual assigned number when available. |
| `qrCode` | `string` | Omitted; no QR1 section. Supply the invoice verification URL, not a QR image or Base64 image. |
| `qr2Code` | `string` | Omitted; no QR2 section. Supply the offline certificate verification URL. |
| `ksefAcquisitionDate` | `string \| Date` | Omitted; no assignment date. FA/FA_RR layouts display it as `DD.MM.YYYY`; PEF layouts currently do not display this field. |

For `ksefAcquisitionDate`, use `YYYY-MM-DD`, an ISO timestamp, or a valid `Date`.
An ISO string contributes the date written in that string; a `Date` contributes
its UTC calendar date. This option does not convert timestamps to Warsaw time.

To add metadata to the quickstart, replace its `renderPdfFromXml` call with:

```js
const pdf = await renderPdfFromXml(xml, {
  nrKSeF: process.env.KSEF_NUMBER,
  ksefAcquisitionDate: process.env.KSEF_ACQUISITION_DATE,
  qrCode: process.env.KSEF_VERIFICATION_URL,
});
```

Set these environment variables in your application's configuration to real
values from your KSeF integration. Unset variables are simply omitted. The
package does not fetch a number/date or construct, sign, or validate verification
URLs. It encodes the URL strings you supply into QR codes and prints them as links.

For an offline invoice, replace the call with:

```js
const pdf = await renderPdfFromXml(xml, {
  qrCode: process.env.KSEF_VERIFICATION_URL,
  qr2Code: process.env.KSEF_CERTIFICATE_URL,
});
```

Provide both URLs for the two-code offline layout. When `qr2Code` is present,
the QR1 caption uses `OFFLINE` instead of the KSeF number. No TEST/DEMO watermark
option is exposed or rendered by this package.

## PEF invoices

Use the same invoice quickstart for PEF XML. The root and `ProfileID` determine
the layout; callers do not need to select a PEF generator manually.

| XML root | ProfileID | `detectPefInvoiceVersion` result |
|---|---|---|
| `Invoice` | `urn:fdc:peppol.eu:2017:poacc:billing:01:1.0` | `PEF` |
| `CreditNote` | `urn:fdc:www.efaktura.gov.pl:ver2.0:corr_inv:ver4.0` | `PEF-CORRECTIVE` |
| `Invoice` | `urn:fdc:www.efaktura.gov.pl:ver2.0:plinv:ver1.4` | `PEF-SPECIALIZED` |

Namespace-prefixed XML is accepted. Unknown profiles and profiles attached to
the wrong root are rejected by the high-level invoice renderer.

## Custom fonts

Roboto is included and used by default. To use another font, register it once
at process startup, before rendering. Both `vfs` and `fonts` must be non-empty.
The first family in `fonts` becomes the default for subsequent invoice and UPO
renders in that process; this is not a per-request setting.

Place your font files in `./fonts/` as shown below. Create
**`render-custom-font.mjs`**, then run `node render-custom-font.mjs`:

```js
import { readFile, writeFile } from 'node:fs/promises';
import { configureFonts, renderPdfFromXml } from '@mdab25/ksef-pdf';

const files = [
  'Company-Regular.ttf',
  'Company-Bold.ttf',
  'Company-Italic.ttf',
  'Company-BoldItalic.ttf',
];
const vfs = Object.fromEntries(await Promise.all(files.map(async (filename) => [
  filename,
  (await readFile(`./fonts/${filename}`)).toString('base64'),
])));

configureFonts({
  vfs,
  fonts: {
    Company: {
      normal: 'Company-Regular.ttf',
      bold: 'Company-Bold.ttf',
      italics: 'Company-Italic.ttf',
      bolditalics: 'Company-BoldItalic.ttf',
    },
  },
});

const xml = await readFile('./invoice.xml');
const pdf = await renderPdfFromXml(xml);
await writeFile('./invoice.pdf', pdf);
```

Use fonts with the characters your invoices need, including Polish diacritics.
Register all four styles: invoice layouts use bold text. If you only have one
font file, all four entries can point to the same VFS filename, but bold and
italic text will then look like regular text.

The example reads the files in your application and passes their Base64 bytes
to pdfmake's in-memory virtual file system. pdfmake itself is denied local-file
and remote-URL resource loading; passing a disk path or URL as a font value
will not load it. Font files are not included with this example.

## Compatibility and low-level APIs

For new integrations, start with the `render*` functions above. Existing callers
can continue using these compatibility functions with any `XmlInput`:

| Function | Output |
|---|---|
| `generateInvoice(xml, additionalData, 'uint8array')` | `Promise<Uint8Array>` |
| `generateInvoice(xml, additionalData, 'base64')` | `Promise<string>` |
| `generateInvoice(xml, additionalData, 'blob')` | `Promise<Blob>` |
| `generatePDFUPO(xml)` or `generatePDFUPO(xml, 'uint8array')` | `Promise<Uint8Array>` |
| `generatePDFUPO(xml, 'blob')` | `Promise<Blob>` |

`additionalData` requires `nrKSeF` (use `''` when absent). Its optional fields
are `qrCode`, `qr2Code`, `acDate`, and `isMobile`. Unlike the `render*` options,
`acDate` is a preformatted display string such as `'25.09.2026'`. Setting
`isMobile: true` suppresses FA attachments and shows an attachment notice;
omit it or use `false` to include attachments. Pass an explicit output format to `generateInvoice`;
although the JavaScript runtime defaults to Blob, the TypeScript overloads
require the format argument.

Low-level exports are `generateFA1`, `generateFA2`, `generateFA3`, `generateFARR`,
`generateBasicPEF`, `generateCorrectivePEF`, and `generateSpecPEF`. They take a
**parsed invoice node in the generator's expected structure**, plus
`additionalData`, rather than XML text or ordinary business-model JSON. They
return a pdfmake document whose `getBuffer()`, `getBase64()`, and `getBlob()`
methods return Promises. The high-level functions handle XML parsing, format
selection, and translation initialization for you.

## Troubleshooting

| Symptom | What to check |
|---|---|
| `Cannot use import statement outside a module` or top-level `await` error | Use the `.mjs` quickstart, set `"type": "module"` in your app, or use the `.cjs` example. |
| `ENOENT` while reading XML or fonts | Run the script from the directory containing the named files, or adjust the paths. |
| XML parse error, NUL characters, or garbled Polish text | Pass the original bytes with `readFile(path)`; avoid forcing UTF-8 on UTF-16 input. |
| `Unsupported or missing invoice version` | Check `KodFormularza`/`kodSystemowy` for FA, or the root and `ProfileID` for PEF. Use the UPO renderer for receipts. |
| `Invalid UPO XML: missing Potwierdzenie node` | Supply UPO XML to `renderUpoPdfFromXml`, not invoice XML or an API error response. |
| `Font ... in style 'bold' is not defined` | Register every style used by the layout, as in the custom-font example. |
| QR section or assignment date is absent | These values are optional and are not fetched automatically. Assignment dates are displayed only in FA/FA_RR layouts. |
| PDF differs after upgrading | Compare content and layout rather than file hashes; labels, pagination, and the version footer may change. Read the release notes. |

## Support / Services

Need help integrating with KSeF, generating PDFs from invoice XML, or building
your own tools around KSeF?

Get in touch — I can help with implementation, integration, and resolving
specific technical issues.

Website: [mdab.it](https://mdab.it)

LinkedIn: [https://www.linkedin.com/in/mateusz-dabrowski25](https://www.linkedin.com/in/mateusz-dabrowski25)

## Release information

- [Changelog](https://github.com/mdabrowski25/ksef-pdf/blob/v1.1.1/CHANGELOG.md)
- [Migrating from 0.x to 1.0](https://github.com/mdabrowski25/ksef-pdf/blob/v1.1.1/docs/migration-to-1.0.md)
- [CIRFMF upstream tracking](https://github.com/mdabrowski25/ksef-pdf/blob/v1.1.1/UPSTREAM.md)
- [1.1.1 release notes](https://github.com/mdabrowski25/ksef-pdf/blob/v1.1.1/docs/releases/v1.1.1.md)

## Development

From a clone of this repository:

```bash
npm ci
npm run typecheck
npm test
npm run build
npm run check:exports
npm run check:docs
npm run check:release
npm pack --dry-run
```

## License

The package is MIT licensed. Adapted third-party code and its license notices
are documented in [THIRD_PARTY_NOTICES.md](https://github.com/mdabrowski25/ksef-pdf/blob/v1.1.1/THIRD_PARTY_NOTICES.md)
and [LICENSES](https://github.com/mdabrowski25/ksef-pdf/tree/v1.1.1/LICENSES).
