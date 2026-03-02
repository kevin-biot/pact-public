# Policy Governance Reference Pack

## NON-NORMATIVE REFERENCE ARTIFACT

This pack is a minimal, non-normative base policy profile demonstrating PACT extension mechanics independent of any vertical domain.

## Scope

This pack intentionally covers:

1. A minimal policy decision envelope (`subject`, `action`, `resource`, `context`, `effect`).
2. One canonical intent class (`policy.decision.request.v1`).
3. Deterministic admission checks for CIC + PSC.

This pack intentionally does not cover:

1. Full regulatory policy catalogs.
2. Runtime policy engine semantics.
3. Jurisdiction overlay composition (`deny-wins`) in this first slice.

## Demonstrated Invariants

1. CIC (Canonical Meaning Precondition): required policy decision fields and canonical values.
2. PSC (Frozen Semantic State): bundle commitment hash must match transaction scope.

## Source Lineage (High-Level)

This reference profile is derived from:

1. PACT constitutional invariants and OCI-1 artifact contract shape.
2. Generic policy ontology concepts (`subject/action/resource/context/effect`) for cross-domain interoperability.

Lineage metadata for this artifact is captured in:

1. `lineage.json`

## Conformance Notes

This reference pack is expected to validate against:

1. `schemas/pack-descriptor.schema.json` (`pack.json`)
2. `schemas/bundle-manifest.schema.json` (`bundle.json`)
3. `schemas/intent-mappings.schema.json` (`intent-mappings.json`)

Reference fixture coverage for this pack is defined in:

1. `fixtures/policy-reference/index.json`
2. `tools/run-policy-reference-fixtures.mjs`
