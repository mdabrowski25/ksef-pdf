# Changelog

All notable changes to this package are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.1.4] - 2026-11-09

### Fixed

- Print the KSeF number under QR1 whenever `nrKSeF` is supplied and `OFFLINE`
  otherwise. Earlier versions printed `OFFLINE` whenever `qr2Code` was present,
  which mislabelled offline invoices already accepted by KSeF.

## [1.1.3] - 2026-11-02

### Fixed

- Use exact integer-cent arithmetic for FA(1), FA(2), and FA(3) VAT summaries,
  preserving small amounts and avoiding floating-point loss on large totals.
- Trim numeric input before reading its sign, preventing upstream's new amount
  parser from misreading whitespace-padded negative XML values. Round excess
  decimal places to cents with midpoint ties away from zero; reject malformed
  nonempty amounts rather than displaying an invalid total.
- Display the FA(3) corrected buyer's JST/GV flags and customer number even when
  contact details are absent.
- Display a single intermediate shipping address in FA(1), FA(2), and FA(3).
- Omit missing PEF corrective total sections and show a dash for an absent
  header payable amount instead of rendering `undefined`. Guard a correction
  extension whose `LegalMonetaryTotal` is absent so rendering does not throw.
- Keep slash-separated invoice numbers readable in dated PEF correction
  references instead of displaying HTML entities such as `&#x2F;`.
- Normalize invoice-number whitespace, OSS tax amount separators, quantities
  in collective corrections, settlement amount grouping, and RR/PEF header spacing.

### Changed

- Synchronized the vendored renderer from CIRFMF `1.1.40` to stable `1.1.46`
  (`8a18843`) and added regressions against the real amount helpers and Node API.
- Preserved public APIs, Node.js 22+, runtime dependencies, package footers,
  date handling, resource policies, and the exclusion of watermarks.

## [1.1.2] - 2026-11-02

### Changed

- Package `author` metadata names Mateusz Dąbrowski and links to mdab.it.
- The README support section links to the KSeF invoice automation case study
  that uses this package.
- Development dependencies (vitest, vite, and source-map-js through tsup) were
  updated to clear new `npm audit` advisories.

This is a metadata and documentation patch release. Runtime implementation,
runtime dependencies, public APIs, and the CIRFMF 1.1.40 baseline are unchanged
from 1.1.1. Generated invoice footers now identify package version 1.1.2.

## [1.1.1] - 2026-09-25

### Changed

- Reorganized the README around a runnable invoice quickstart, CommonJS/UPO/Base64
  recipes, API and input references, metadata/QR guidance, PEF, fonts, and troubleshooting.
- Retained the support advertisement, translated it into English, and added
  the mdab.it website alongside LinkedIn.
- Documented defaults, return types, encoding handling, process-wide font
  configuration, acquisition-date behavior, and compatibility API differences.

### Fixed

- Read XML as bytes in the quickstart so UTF-16 detection can work.
- Register all four font styles in the README and migration examples to avoid
  missing-bold-font errors.

This is a documentation-focused patch release. Runtime implementation,
dependencies, public APIs, and the CIRFMF 1.1.40 baseline are unchanged from
1.1.0. Generated invoice footers now identify package version 1.1.1.

## [1.1.0] - 2026-09-25

### Added

- PEF basic, corrective, and specialized invoice rendering through the existing
  Node APIs, plus `detectPefInvoiceVersion` and three low-level PEF generators.
- UTF-16 LE/BE XML decoding, with or without a BOM, for binary invoice and UPO
  inputs, including Node `Blob` and `File` values.
- Regression coverage for encoded inputs, PEF content and correction amounts,
  output formats, and the upstream transport fix.

### Fixed

- Render descriptions of other cargo even when no standard cargo code is set.
- Apply currency formatting to transaction exchange rates.
- Add spacing after the KSeF number label and correct the UPO document-parts label.

### Changed

- Synchronized the vendored renderer from CIRFMF `1.1.31` to `1.1.40`
  (`f59fc4e`), including the `1.1.36` and `1.1.39` releases.
- Use upstream's typed translation resources.
- Preserve the existing FA detection type, Node 22 requirement, ESM/CJS APIs,
  virtual fonts, resource policies, QR options, package footers, and Warsaw date handling.

## [1.0.1] - 2026-08-20

### Fixed

- Restored the Polish support and services contact section in the package README.

## [1.0.0] - 2026-08-20

### Added

- FA_RR(1) invoice rendering and version detection.
- QR2 offline-certificate rendering, KSeF-number acquisition date, and virtual custom-font configuration.
- The CIRFMF 1.1.31 localization, correction, attachment, formatting, and pagination capabilities.
- Node 22 and Node 24 CI, public export checks, release consistency checks, and the upstream sync ledger.

### Changed

- Minimum supported Node.js version is now 22.
- Updated the rendering engine from pdfmake 0.2 to 0.3 and its Promise-based document API.
- Synchronized the vendored renderer with CIRFMF/ksef-pdf-generator `1.1.31` (`2b7c1da`).
- PDF footers identify `@mdab25/ksef-pdf` and its package version.
- Invoice layouts now use current CIRFMF labels, number grouping, payment sections, QR layout, and page-breaking behavior.

### Removed

- TEST/DEMO watermark support from the public and low-level invoice generator data contract.
- Node.js 20 support.

### Security

- Deny pdfmake local-file and URL resource loading by default.
- Updated build and test dependencies to versions with no known npm audit findings.

See [Migrating to 1.0.0](docs/migration-to-1.0.md) for breaking changes.

## [0.2.3] - 2026-07-12

### Fixed

- Formatted payment dates as `DD.MM.YYYY`.
- Added official-style PDF page footers.

## [0.2.1] - 2026-04-02

### Changed

- Updated package dependencies and metadata after the QR release.

## [0.2.0] - 2026-04-02

### Added

- KSeF number and QR verification-link rendering.

## [0.1.2] - 2026-03-06

### Changed

- Documentation and package version maintenance.

## [0.1.1] - 2026-03-02

### Fixed

- Package name, repository metadata, and pdfmake imports.

## [0.1.0] - 2026-03-02

### Added

- Initial Node.js package for FA(1), FA(2), FA(3), UPO(4.2), and UPO(4.3) PDF rendering.
- ESM/CJS builds and Node-friendly XML input adapters.

[Unreleased]: https://github.com/mdabrowski25/ksef-pdf/compare/v1.1.4...HEAD
[1.1.4]: https://github.com/mdabrowski25/ksef-pdf/compare/v1.1.3...v1.1.4
[1.1.3]: https://github.com/mdabrowski25/ksef-pdf/compare/v1.1.2...v1.1.3
[1.1.2]: https://github.com/mdabrowski25/ksef-pdf/compare/v1.1.1...v1.1.2
[1.1.1]: https://github.com/mdabrowski25/ksef-pdf/compare/v1.1.0...v1.1.1
[1.1.0]: https://github.com/mdabrowski25/ksef-pdf/compare/v1.0.1...v1.1.0
[1.0.1]: https://github.com/mdabrowski25/ksef-pdf/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/mdabrowski25/ksef-pdf/compare/b804404...v1.0.0
[0.2.3]: https://github.com/mdabrowski25/ksef-pdf/compare/b39afb2...b804404
[0.2.1]: https://github.com/mdabrowski25/ksef-pdf/compare/52c65df...b39afb2
[0.2.0]: https://github.com/mdabrowski25/ksef-pdf/compare/5306d09...52c65df
[0.1.2]: https://github.com/mdabrowski25/ksef-pdf/compare/119446f...5306d09
[0.1.1]: https://github.com/mdabrowski25/ksef-pdf/compare/8244eb4...119446f
[0.1.0]: https://github.com/mdabrowski25/ksef-pdf/commit/8244eb4
