# @mdab25/ksef-pdf

Node.js 22+ PDF renderer for Polish KSeF XML documents. The package adapts the
public CIRFMF visualization logic for server-side ESM and CommonJS use.

## Wsparcie / Usługi

Potrzebujesz wsparcia przy integracji z KSeF, generowaniu PDF z faktur XML lub
budowie własnych narzędzi wokół KSeF?

Skontaktuj się ze mną – chętnie pomogę w implementacji, integracji lub
rozwiązaniu konkretnych problemów technicznych.

LinkedIn: [https://www.linkedin.com/in/mateusz-dabrowski25](https://www.linkedin.com/in/mateusz-dabrowski25)

## Supported documents

| Document | Supported |
|---|---|
| FA(1) | Yes |
| FA(2) | Yes |
| FA(3) | Yes |
| FA_RR(1) | Yes |
| PEF basic, corrective, specialized | Yes |
| UPO(4.2) | Yes |
| UPO(4.3) | Yes |

All invoice kinds represented by those schemas are rendered, including VAT,
advance, settlement, simplified, corrective, collective-corrective,
foreign-currency, multi-rate, and attachment-bearing invoices.

## Install

```bash
npm install @mdab25/ksef-pdf
```

Node.js 22 or newer is required.

## Render an invoice

```ts
import { readFile, writeFile } from 'node:fs/promises';
import { renderPdfFromXml } from '@mdab25/ksef-pdf';

const xml = await readFile('./invoice.xml', 'utf8');
const pdf = await renderPdfFromXml(xml, {
  nrKSeF: '1234567890-20260820-ABCDEF123456-01',
  ksefAcquisitionDate: '2026-08-20T10:30:00Z',
  qrCode: 'https://qr.ksef.mf.gov.pl/invoice/example',
});

await writeFile('./invoice.pdf', pdf);
```

`renderPdfFromXml` and `renderPdfBase64FromXml` accept `string`, `Uint8Array`,
`ArrayBuffer`, `Blob`, or `File` input. `ksefAcquisitionDate` accepts an ISO date,
ISO timestamp, or `Date` and is rendered as `DD.MM.YYYY`.

Binary XML inputs support UTF-8 and UTF-16 LE/BE, with or without a byte-order
mark. The same input handling applies to UPO and compatibility APIs.

## PEF invoices

Use `renderPdfFromXml`, `renderPdfBase64FromXml`, or `generateInvoice` for PEF
documents too. The renderer selects the upstream PEF layout from the XML root
and `ProfileID`:

| Root | ProfileID | Kind |
|---|---|---|
| `Invoice` | `urn:fdc:peppol.eu:2017:poacc:billing:01:1.0` | Basic |
| `CreditNote` | `urn:fdc:www.efaktura.gov.pl:ver2.0:corr_inv:ver4.0` | Corrective |
| `Invoice` | `urn:fdc:www.efaktura.gov.pl:ver2.0:plinv:ver1.4` | Specialized |

`detectPefInvoiceVersion(xml)` returns `PEF`, `PEF-CORRECTIVE`,
`PEF-SPECIALIZED`, or `null` for an unsupported profile. It throws on malformed
XML. The existing `detectInvoiceVersion` helper keeps its FA-only return type.
Low-level PEF exports are `generateBasicPEF`, `generateCorrectivePEF`, and
`generateSpecPEF`, with the same Promise-based pdfmake methods as the FA exports.

## Offline QR2

```ts
const pdf = await renderPdfFromXml(xml, {
  qrCode: verificationUrl,
  qr2Code: certificateUrl,
});
```

No TEST/DEMO watermark is exposed or rendered by this package.

## Custom virtual fonts

```ts
import { configureFonts } from '@mdab25/ksef-pdf';

configureFonts({
  vfs: { 'Custom-Regular.ttf': base64Font },
  fonts: {
    Custom: { normal: 'Custom-Regular.ttf' },
  },
});
```

Only in-memory VFS fonts are supported. Local-path and remote resource loading
is denied by default.

## Compatibility APIs

The package continues to export `generateInvoice`, `generatePDFUPO`,
`generateFA1`, `generateFA2`, `generateFA3`, version-detection helpers, and the
three high-level `render*` functions. Version 1.0 adds `generateFARR` and changes
the low-level pdfmake object to Promise-based methods.

- [Changelog](CHANGELOG.md)
- [Migrating to 1.0.0](docs/migration-to-1.0.md)
- [CIRFMF upstream tracking](UPSTREAM.md)
- [1.1.0 release notes](docs/releases/v1.1.0.md)

## Development

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
are documented in `THIRD_PARTY_NOTICES.md` and `LICENSES/`.
