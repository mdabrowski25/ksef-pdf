# Third-Party Notices

This package includes adapted code from the following project:

## CIRFMF/ksef-pdf-generator

- Repository: https://github.com/CIRFMF/ksef-pdf-generator
- Copyright: CIRFMF contributors
- Upstream license metadata: ISC (as declared in upstream `package.json`)
- Upstream repository license file: MIT

Because upstream's package metadata and repository license file differ, this
package retains both notices:
- `LICENSES/CIRFMF-ksef-pdf-generator-ISC.txt`
- `LICENSES/CIRFMF-ksef-pdf-generator-MIT.txt`

The vendored and adapted source code is located under `src/upstream`.

Current imported baseline:
- Release: `1.1.31`
- Commit: `2b7c1daea6fc3438a4cf28195f2deac75dda4220`
- Imported: 2026-08-20

Changes in this package include:
- Node.js-oriented XML input handling (`string`/`Uint8Array`/`Blob`)
- Node-first API wrappers returning PDF bytes (`Uint8Array`)
- Version-detection helper API for invoices and UPO
- Packaging, tests, and build/publish integration
- Node.js 22+ Promise-based pdfmake adapter
- Removal of watermark propagation from the package API
- Package-owned footer identity and deny-by-default resource access
