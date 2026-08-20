# Migrating to @mdab25/ksef-pdf 1.0.0

## Runtime requirement

Version 1.0.0 requires Node.js 22 or newer. Upgrade the runtime before changing
the package dependency.

```bash
npm install @mdab25/ksef-pdf@^1.0.0
```

## High-level API compatibility

These APIs keep their previous names, inputs, and result shapes:

- `renderPdfFromXml` returns `Promise<Uint8Array>`.
- `renderPdfBase64FromXml` returns `Promise<string>`.
- `renderUpoPdfFromXml` returns `Promise<Uint8Array>`.
- `generateInvoice` supports `blob`, `base64`, and `uint8array`.
- `generatePDFUPO` supports `blob` and `uint8array`.
- ESM and CommonJS root entry points remain available.

Existing high-level 0.2.3 code continues to work after moving to Node 22.

## Low-level pdfmake methods

The `generateFA1`, `generateFA2`, and `generateFA3` functions remain exported,
and `generateFARR` is new. Their returned pdfmake 0.3 document uses Promises.

Before:

```ts
const document = generateFA3(invoice, additionalData);
document.getBuffer((buffer) => usePdf(buffer));
```

After:

```ts
const document = generateFA3(invoice, additionalData);
const buffer = await document.getBuffer();
usePdf(buffer);
```

The same change applies to `getBlob()` and `getBase64()`.

## New invoice metadata

```ts
const pdf = await renderPdfFromXml(xml, {
  nrKSeF,
  qrCode,
  qr2Code,
  ksefAcquisitionDate: acceptedAt,
});
```

- `qr2Code` renders the offline certificate QR section.
- `ksefAcquisitionDate` renders the KSeF-number assignment date.
- `detectInvoiceVersion` now returns `FA_RR(1)` for agricultural flat-rate invoices.

## Custom fonts

Call `configureFonts` once during process startup. Font files must be supplied
through the virtual file system; file paths and remote font URLs are not accepted.

```ts
import { configureFonts } from '@mdab25/ksef-pdf';

configureFonts({
  vfs: { 'Company-Regular.ttf': companyFontBase64 },
  fonts: {
    Company: { normal: 'Company-Regular.ttf' },
  },
});
```

## Intentional output changes

PDF output follows CIRFMF 1.1.31 behavior and is not byte-compatible with 0.2.3.
Changes include labels, thousand separators, bank accounts, payment layout,
JST/GV fields, P_15, QR layout, page breaking, and the package version footer.
TEST/DEMO watermark output is not supported.

Snapshot or hash assertions against 0.2.3 PDFs must be replaced with content,
page-count, or visual assertions appropriate for the new layout.
