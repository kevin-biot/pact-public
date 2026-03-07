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

## Distribution Modes

PACT supports both deployer distribution modes:

1. Public pack registries (for open/shared ecosystems).
2. Private pack registries (for enterprise-controlled deployments).

Conformance requirements remain the same in both modes.

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

Authority boundary guidance:

1. `docs/architecture/pack-bounded-authority.md` — packs are authoritative for execution; external context (including RAG/graph retrieval) is advisory and must not silently expand scope.

## Architecture Decisions

Public ADRs define specification intent and boundaries:

1. `docs/adr/ADR-000-public-scope-and-non-goals.md`
2. `docs/adr/ADR-001-governance-safety-invariants.md`
3. `docs/adr/ADR-002-artifact-contract-and-conformance-fixtures.md`
4. `docs/adr/ADR-003-extension-model-and-reference-vertical-packs.md`

ADR index:

1. `docs/adr/README.md`

## Conformance Fixtures

This repository includes implementation-neutral OCI-1 conformance fixtures under:

1. `fixtures/oci1/valid`
2. `fixtures/oci1/invalid`
3. `docs/architecture/oci-1-fixture-index.json`
4. `docs/architecture/oci-1-error-map.json`

Run the fixture harness:

```bash
node tools/run-oci1-conformance-fixtures.mjs
```

Run the reference telco CIC+PSC fixture harness:

```bash
node tools/run-telco-reference-fixtures.mjs
```

Run the reference policy CIC+PSC fixture harness:

```bash
node tools/run-policy-reference-fixtures.mjs
```

Regenerate synthetic fixtures (including test signatures):

```bash
node tools/generate-oci1-fixtures.mjs
```

Fixture signing keys are test-only and must not be used in production systems.

## Reference Vertical Pack

This repository includes:

1. `verticals/telco-reference-pack/`
2. `verticals/policy-reference-pack/`

This telco pack is a non-normative example vertical profile demonstrating PACT extension mechanics.
It does not define TM Forum standards and does not replace IG1453.

The policy reference pack is a non-normative base-policy example demonstrating cross-domain policy semantics independent of telco standards.
It includes a minimal jurisdiction overlay deny-wins composition example.

## Real-World Deployment View

For a concise implementation-neutral flow from task intake to regulated execution evidence, see:

1. `docs/architecture/real-world-deployment-overview.md`

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
