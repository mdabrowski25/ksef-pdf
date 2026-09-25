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
- Release: `1.1.40`
- Commit: `f59fc4e2addcf42c74b1674e7c1d534085bc3a84`
- Imported: 2026-09-25

Changes in this package include:
- Node.js-oriented XML input handling (`string`/`Uint8Array`/`Blob`)
- Node-first API wrappers returning PDF bytes (`Uint8Array`)
- Version-detection helper API for invoices and UPO
- Packaging, tests, and build/publish integration
- Node.js 22+ Promise-based pdfmake adapter
- Removal of watermark propagation from the package API
- Package-owned footer identity and deny-by-default resource access
