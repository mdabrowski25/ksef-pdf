# CIRFMF upstream tracking

This package vendors and adapts the public runtime from
[`CIRFMF/ksef-pdf-generator`](https://github.com/CIRFMF/ksef-pdf-generator).
The `upstream` Git remote points to that repository. Each synchronization must
update this file and `CHANGELOG.md` before release.

## Current baseline

| Field | Value |
|---|---|
| Upstream branch | `main` |
| Upstream release | `1.1.31` |
| Upstream commit | `2b7c1daea6fc3438a4cf28195f2deac75dda4220` |
| Imported | 2026-08-20 |
| Local package release | `1.0.0` |

## Imported capabilities

- FA(1), FA(2), FA(3), and FA_RR(1) invoice visualization.
- UPO(4.2) and UPO(4.3) visualization.
- Polish and English label resources, with Polish as this package's default.
- QR1/QR2, KSeF-number acquisition date, custom virtual fonts, attachments,
  collective-correction fixes, P_15 fixes, number formatting, and pagination fixes.
- The full upstream generator unit suite under `src/upstream`.

## Excluded upstream code

- The Vite demo application and browser-only entry point.
- Browser language detectors and HTTP translation backends.
- TEST/DEMO watermark propagation.

## Local adaptations

- Node 22+ XML inputs: `string`, `Uint8Array`, `ArrayBuffer`, `Blob`, and `File`.
- ESM and CJS package entry points returning bytes, Base64, or Blob values.
- Explicit `.js` pdfmake subpath imports required by Node ESM resolution.
- pdfmake 0.3 Promise adapters and deny-by-default local/URL resource policies.
- Server-only i18next initialization with debug and support-console output disabled.
- PDF footer identity uses `@mdab25/ksef-pdf` and the package version.
- The high-level API normalizes spaced/unspaced schema identifiers and formats
  the KSeF acquisition date as `DD.MM.YYYY`.

## Known upstream gap

The public CIRFMF repository currently ends at 1.1.31. A PDF downloaded from the
KSeF TEST portal on 2026-08-19 reported renderer 1.1.36. This package does not
claim that unreleased version. Portal-only behavior must be verified separately
or imported when CIRFMF publishes it.

## Synchronization procedure

1. Fetch `upstream/main` and record its exact SHA and nearest release tag.
2. Review source, dependency, license, schema, and public API changes.
3. Replace the vendored `src/lib-public` and `src/shared` runtime snapshot.
4. Reapply only the local adaptations listed above.
5. Run typecheck, the upstream suite, package API tests, visual tests, build,
   export checks, release checks, npm audit, and `npm pack --dry-run`.
6. Update this ledger, the migration guide when required, and the changelog.
