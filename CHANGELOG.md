# Changelog

All notable changes to this package are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

[Unreleased]: https://github.com/mdabrowski25/ksef-pdf/compare/v1.0.1...HEAD
[1.0.1]: https://github.com/mdabrowski25/ksef-pdf/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/mdabrowski25/ksef-pdf/compare/b804404...v1.0.0
[0.2.3]: https://github.com/mdabrowski25/ksef-pdf/compare/b39afb2...b804404
[0.2.1]: https://github.com/mdabrowski25/ksef-pdf/compare/52c65df...b39afb2
[0.2.0]: https://github.com/mdabrowski25/ksef-pdf/compare/5306d09...52c65df
[0.1.2]: https://github.com/mdabrowski25/ksef-pdf/compare/119446f...5306d09
[0.1.1]: https://github.com/mdabrowski25/ksef-pdf/compare/8244eb4...119446f
[0.1.0]: https://github.com/mdabrowski25/ksef-pdf/commit/8244eb4
