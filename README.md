# PACT Public Specification Bundle

This repository publishes the public, implementation-neutral specification surface for PACT (Pack-based Agentic Contract for Trust).

## Scope

This repo contains:

1. Informational drafts and companion specification drafts.
2. OCI-1 profile and contract documentation.
3. Public JSON schemas used for compatibility and conformance claims.
4. Export manifest metadata (`manifest.sha256.json`, `export-metadata.json`).

This repo does **not** contain:

1. Runtime service implementation code.
2. Internal operational artifacts.
3. Private signing material or seed keys.
4. Private pack registries.

## Normative Contract Baseline

Implementations claiming OCI-1 compatibility are expected to validate against:

1. `docs/architecture/oci-1-profile.json`
2. `docs/architecture/oci-1-contract-profile.md`
3. `schemas/pack-descriptor.schema.json`
4. `schemas/bundle-manifest.schema.json`
5. `schemas/pack-index.schema.json`
6. `schemas/intent-mappings.schema.json`
7. `schemas/entity-patterns.schema.json`
8. `schemas/convergence-fixtures.schema.json`
9. `schemas/promotion-gate-result.schema.json`
10. `schemas/delivery-profile.schema.json`

## Publication Model

This repository is generated from a private core engineering repo using an allowlisted export process. The export process is designed to keep internal code, keys, and non-public artifacts out of this repository.

## License

See [LICENSE](./LICENSE).
