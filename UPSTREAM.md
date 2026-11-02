# CIRFMF upstream tracking

This package vendors and adapts the public runtime from
[`CIRFMF/ksef-pdf-generator`](https://github.com/CIRFMF/ksef-pdf-generator).
The `upstream` Git remote points to that repository. Each synchronization must
update this file and `CHANGELOG.md` before release.

## Current baseline

| Field | Value |
|---|---|
| Upstream branch | `main` |
| Upstream release | `1.1.46` |
| Upstream commit | `8a18843db12d0013a417500bb2f98bfe49b7d2a8` |
| Imported | 2026-11-02 |
| Local package release | `1.1.3` |

## Imported capabilities

- FA(1), FA(2), FA(3), and FA_RR(1) invoice visualization.
- UPO(4.2) and UPO(4.3) visualization.
- PEF basic, corrective, and specialized invoices.
- UTF-16 LE/BE input decoding, transaction exchange-rate formatting, other-cargo
  rendering, KSeF header spacing, and corrected UPO document-parts text.
- Polish and English label resources, with Polish as this package's default.
- QR1/QR2, KSeF-number acquisition date, custom virtual fonts, attachments,
  collective-correction fixes, P_15 fixes, number formatting, and pagination fixes.
- The full upstream generator unit suite under `src/upstream`.
- Exact-cent FA VAT summaries, corrected-buyer JST/GV/customer details,
  singleton intermediate shipping addresses, missing PEF total handling,
  invoice-number whitespace, and amount/header formatting fixes from 1.1.46.

## Excluded upstream code

- The Vite demo application and browser-only entry point.
- Browser language detectors and HTTP translation backends.
- TEST/DEMO watermark propagation.
- Upstream's demo/build/test dependency changes; this package keeps its own
  Node build and test toolchain. Its existing pdfmake 0.3.11 baseline already
  satisfies the renderer update introduced in upstream 1.1.36.
- Unreleased `release/1.1.48` changes (reviewed on 2026-11-02; upstream planned
  release 2026-11-06): PDF Creator/Producer metadata, PEF/UPO watermarks, and
  the new UPO options argument. Revisit metadata after a stable release while
  preserving this package's identity, watermark exclusion, and existing UPO
  second `formatType` argument. See [upstream PR #154](https://github.com/CIRFMF/ksef-pdf-generator/pull/154).

## Local adaptations

- Node 22+ XML inputs: `string`, `Uint8Array`, `ArrayBuffer`, `Blob`, and `File`.
- Shared UTF-8/UTF-16 decoding for Node inputs and the vendored XML parser.
- ESM and CJS package entry points returning bytes, Base64, or Blob values.
- Explicit `.js` pdfmake subpath imports required by Node ESM resolution.
- pdfmake 0.3 Promise adapters and deny-by-default local/URL resource policies.
- Server-only i18next initialization with debug and support-console output disabled.
- Deterministic Europe/Warsaw timestamp formatting across host time zones while
  preserving timezone-free XML values as local wall times.
- PDF footer identity uses `@mdab25/ksef-pdf` and the package version.
- PEF footer identity also uses the package name and version.
- Public PEF dispatch validates the root and profile together; PEF detection is
  a separate helper so the existing FA version type stays unchanged.
- The high-level API normalizes spaced/unspaced schema identifiers and formats
  the KSeF acquisition date as `DD.MM.YYYY`.
- The integer-cent amount helper trims numeric whitespace before sign detection,
  rounds excess fractional digits with ties away from zero, and rejects invalid
  nonempty decimal input. Upstream 1.1.46 assumes already-trimmed XML and truncates
  excess digits; the Node API preserves XML text whitespace.
- The PEF header guards missing `LegalMonetaryTotal` inside an existing correction
  extension. Upstream 1.1.46 handles a missing payable amount but still dereferences
  the absent totals object in that case.
- Dated PEF correction references disable HTML escaping for that translation's
  interpolation only. pdfmake renders plain text, so HTML-escaped slashes would
  otherwise appear literally as `&#x2F;` in invoice numbers.

## Local release history

### 1.1.3 - 2026-11-02

- Imported stable upstream 1.1.46, including all 16 changed runtime files and
  the associated upstream test updates. Existing local adaptations are retained.
- Corrected the whitespace/sign integration issue in upstream's new `toBigInt`
  helper and retained decimal rounding for excess-precision summary amounts.
- Completed the upstream PEF missing-total fix with a null guard for a correction
  extension that exists without `LegalMonetaryTotal`.
- Corrected dated PEF correction references that displayed HTML-escaped invoice
  numbers in plain-text PDF output.
- Added regression coverage that exercises actual amount arithmetic, the public
  XML-to-PDF path, and the changed invoice sections.
- Runtime dependencies, public exports, licenses, and Node requirement are
  unchanged. No migration from 1.1.x is required.

### 1.1.2 - 2026-11-02

- No upstream runtime changes; the imported baseline remains CIRFMF 1.1.40.
- Linked the package author and README support section to mdab.it and updated
  development dependencies to clear `npm audit` advisories.
- Updated the package version and therefore the generated invoice footer.

### 1.1.1 - 2026-09-25

- No upstream runtime changes; the imported baseline remains CIRFMF 1.1.40.
- Reorganized and corrected the package usage documentation, translated the
  support advertisement into English, and added mdab.it alongside LinkedIn.
- Updated the package version and therefore the generated invoice footer.

### 1.1.0 - 2026-09-25

- Imported public upstream releases 1.1.36, 1.1.39, and 1.1.40. The previously
  recorded gap between the public repository and portal renderer 1.1.36 is closed.
- Upstream license files and runtime dependency requirements remain compatible.
- Preserved local adaptations and extended the Node APIs to the new PEF and
  UTF-16 functionality. No migration from 1.0.x is required.

### 1.0.1 - 2026-08-20

- No upstream runtime changes.
- Restored the package support and services contact information in `README.md`.

## Synchronization procedure

1. Fetch `upstream/main` and record its exact SHA and nearest release tag.
2. Review source, dependency, license, schema, and public API changes.
3. Replace the vendored `src/lib-public` and `src/shared` runtime snapshot.
4. Reapply only the local adaptations listed above.
5. Run typecheck, the upstream suite, package API tests, visual tests, build,
   export checks, release checks, npm audit, and `npm pack --dry-run`.
6. Update this ledger, the migration guide when required, and the changelog.
