# @mdab/ksef-pdf

Node.js package for generating PDF visualizations from KSeF XML documents.

- Invoices: `FA(1)`, `FA(2)`, `FA(3)`
- UPO: `UPO(4.2)`, `UPO(4.3)`
- Runtime: Node.js `>=20`

This package vendors and adapts renderer logic from `CIRFMF/ksef-pdf-generator` for server-side use.

## Install

```bash
npm install @mdab/ksef-pdf
```

## Quick Start

```ts
import { readFile, writeFile } from 'node:fs/promises';
import { renderPdfFromXml } from '@mdab/ksef-pdf';

const xml = await readFile('./invoice.xml', 'utf8');
const pdf = await renderPdfFromXml(xml);

await writeFile('./invoice.pdf', pdf);
```

## API

### Types

```ts
type KsefInvoiceVersion = 'FA(1)' | 'FA(2)' | 'FA(3)';
type KsefUpoVersion = 'UPO(4.2)' | 'UPO(4.3)';
```

### Functions

```ts
function detectInvoiceVersion(xml: string): KsefInvoiceVersion | null;
function detectUpoVersion(xml: string): KsefUpoVersion | null;

function renderPdfFromXml(
  xml: string | Uint8Array | ArrayBuffer | Blob
): Promise<Uint8Array>;

function renderPdfBase64FromXml(
  xml: string | Uint8Array | ArrayBuffer | Blob
): Promise<string>;

function renderUpoPdfFromXml(
  xml: string | Uint8Array | ArrayBuffer | Blob
): Promise<Uint8Array>;
```

Compatibility exports (upstream-like):
- `generateInvoice`
- `generatePDFUPO`
- `generateFA1`
- `generateFA2`
- `generateFA3`

## Notes

- This package renders PDFs from XML schema content only.
- It does not inject `Numer KSEF` or QR payload values at wrapper API level.

## Minimal HTTP Service Example (n8n-friendly)

```ts
import express from 'express';
import { renderPdfFromXml } from '@mdab/ksef-pdf';

const app = express();
app.use(express.text({ type: ['application/xml', 'text/xml'], limit: '10mb' }));

app.get('/health', (_req, res) => res.send('OK'));

app.post('/render', async (req, res) => {
  const pdf = await renderPdfFromXml(req.body);
  res.setHeader('Content-Type', 'application/pdf');
  res.send(Buffer.from(pdf));
});

app.listen(3100);
```

## Development

```bash
npm install
npm run typecheck
npm test
npm run build
```

## Publish

```bash
npm login
npm publish --access public
```

Before publishing, verify package contents:

```bash
npm pack --dry-run
```

## License

This package is licensed under `MIT` (see `LICENSE`).

It also includes adapted third-party source code. See:
- `THIRD_PARTY_NOTICES.md`
- `LICENSES/CIRFMF-ksef-pdf-generator-ISC.txt`
