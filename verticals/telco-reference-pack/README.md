# Telco Governance Reference Pack

## NON-NORMATIVE REFERENCE ARTIFACT

This pack is a minimal, non-normative vertical profile that demonstrates PACT extension mechanics for telco fault-diagnosis governance.

## Scope

This pack intentionally covers:

1. One task type (`FaultDiagnosis`).
2. One canonical intent class (`fault.diagnosis.request.v1`).
3. One mandatory target object identifier.
4. One mandatory fault occurrence timestamp.

This pack intentionally does not cover:

1. Full TM Forum IG1453 structured prompt model.
2. Full 3GPP intent or AI/ML lifecycle semantics.
3. Overlay deny-wins jurisdiction composition.
4. End-to-end runtime orchestration behavior.

This pack does not define TM Forum standards and does not replace IG1453.
It is a reference profile for deterministic governance behavior.

## Demonstrated Invariants

1. CIC (Canonical Meaning Precondition): required fields and canonical values.
2. PSC (Frozen Semantic State): bundle hash commitment checked at execution admission.

Overlay deny-wins composition is intentionally not included in this first reference slice.

## Source Lineage (High-Level)

This reference profile is derived at a high level from:

1. TM Forum IG1453 A2A-T fault-diagnosis task structure (ingress semantics).
2. PACT constitutional invariants (CIC and PSC).
3. OCI-1 artifact contract model (`pack.json`, `bundle.json`, `obt.jws`).

Lineage metadata for this artifact is captured in:

1. `lineage.json`

## Conformance Notes

This reference pack is expected to validate against the OCI-1 baseline schemas:

1. `schemas/pack-descriptor.schema.json` (`pack.json`)
2. `schemas/bundle-manifest.schema.json` (`bundle.json`)
3. `schemas/intent-mappings.schema.json` (`intent-mappings.json`)

Reference fixture coverage for this pack is defined in:

1. `fixtures/telco-reference/index.json`
2. `tools/run-telco-reference-fixtures.mjs`
