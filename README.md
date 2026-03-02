# PACT Public Specification Bundle

This repository publishes the public, implementation-neutral specification surface for PACT (Pack-based Agentic Contract for Trust).

PACT defines governance invariants and artifact contracts for deterministic, regulated agent execution. It does not prescribe any specific runtime architecture.

## Scope

This repository contains:

1. Informational and normative specification drafts.
2. OCI-1 profile and contract documentation.
3. Public JSON Schemas supporting compatibility and conformance claims.
4. Export manifest metadata (`manifest.sha256.json`, `export-metadata.json`).

This repository does not contain:

1. Runtime service implementation code.
2. Orchestration engines or workflow implementations.
3. Internal operational artifacts.
4. Private signing material or seed keys.
5. Private pack registries.

PACT is implementation-neutral. Multiple independent implementations are expected and encouraged.

## Normative Contract Baseline

Implementations claiming OCI-1 compatibility MUST validate against the following normative artifacts:

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

Conformance claims should reference specific artifact versions or release tags.

## Publication Model

This repository is generated from a private core engineering repository using an allowlisted export process.

The export boundary ensures:

1. Separation of specification artifacts from runtime implementation.
2. No publication of private keys, internal code, or non-public registries.
3. Reproducible public specification surfaces.

PACT does not depend on any specific implementation.

## License

This repository is licensed under the Apache License, Version 2.0.

The Apache 2.0 license applies to the specification documents and schema artifacts contained herein. It does not imply publication or licensing of any private implementation.

See [LICENSE](./LICENSE).
