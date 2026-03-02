# Third-Party Notices

This package includes adapted code from the following project:

## CIRFMF/ksef-pdf-generator

- Repository: https://github.com/CIRFMF/ksef-pdf-generator
- Copyright: CIRFMF contributors
- Upstream license metadata: ISC (as declared in upstream `package.json`)
- Upstream license file in repository: MIT (`.tmp_upstream/LICENSE` in this workspace)

For compliance in this package, the upstream ISC text is included at:
- `LICENSES/CIRFMF-ksef-pdf-generator-ISC.txt`

The vendored and adapted source code is located under `src/upstream`.

Changes in this package include:
- Node.js-oriented XML input handling (`string`/`Uint8Array`/`Blob`)
- Node-first API wrappers returning PDF bytes (`Uint8Array`)
- Version-detection helper API for invoices and UPO
- Packaging, tests, and build/publish integration
