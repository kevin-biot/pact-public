# OCI-1 Contract Profile

**Version:** 1.0  
**Status:** Draft baseline  
**Authority:** `docs/adr/ADR-002-artifact-contract-and-conformance-fixtures.md`

## 1. Contract Authority

OCI-1 is defined by these artifacts:

0. Machine-readable profile and version gate root:
   - `docs/architecture/oci-1-profile.json`

1. Public authority and conformance model:
   - `docs/adr/ADR-002-artifact-contract-and-conformance-fixtures.md`
   - `docs/adr/ADR-001-governance-safety-invariants.md`
2. Pack wire schemas:
   - `schemas/pack-descriptor.schema.json`
   - `schemas/bundle-manifest.schema.json`
   - `schemas/pack-index.schema.json`
   - `schemas/intent-mappings.schema.json`
   - `schemas/entity-patterns.schema.json`
   - `schemas/convergence-fixtures.schema.json`
3. Deterministic execution obligations:
   - `docs/adr/ADR-001-governance-safety-invariants.md`
   - `docs/architecture/pack-bounded-authority.md`

## 2. Supported Client Classes

1. External SDKs (TypeScript now, additional languages later).
2. CLI clients (Go `ontology-cli` path).
3. Service-to-service adapters in runtime services (Go HTTP/JWKS/RTGF client paths).

## 3. Stable Operations

1. Registry discovery and pack fetch:
   - `GET /index.json`
   - `GET /{domain}/pack.json`
   - `GET /{domain}/bundle.json`
   - `GET /{domain}/obt.jws`
   - `GET /{domain}/{filename}`
2. Policy gate operations:
   - `GET /policy/snapshot`
   - `POST /ontology/bind`
   - `POST /attest`

## 4. Deterministic Contract Rules

1. OBT signature, key selection (`kid`), and payload verification are fail-closed.
2. Canonicalization checks must be equivalent across client implementations.
3. Bundle/time/revocation checks (`nbf`, `exp`, `revEpoch`) use deterministic machine outcomes.
4. Error codes are stable and language-neutral (see `docs/architecture/oci-1-error-map.json`).
5. Unsigned pack provenance metadata (`pack.json` `dc`) is informational only and MUST NOT be treated as authority-bearing.

## 5. Versioning

1. Minor additions are backward-compatible.
2. Breaking semantic changes require OCI major version bump.
3. No unversioned contract break is allowed on main.
4. CI/release automation SHOULD enforce a version gate when OCI contract files change, using `docs/architecture/oci-1-profile.json` `contract_files` as the baseline list.

## 6. Public Fixture Baseline

Implementation-neutral fixtures are published as part of OCI-1 baseline:

1. `docs/architecture/oci-1-fixture-index.json`
2. `docs/architecture/oci-1-error-map.json`
3. `fixtures/oci1/valid/*`
4. `fixtures/oci1/invalid/*`

Reference harness:

1. `tools/run-oci1-conformance-fixtures.mjs`

## 7. Reference Vertical Profile (Non-Normative)

This repository includes `verticals/telco-reference-pack` as a minimal reference vertical profile.

Purpose:

1. Demonstrate extension mechanics against OCI-1 artifact contracts.
2. Demonstrate CIC + PSC checks using synthetic telco fault-diagnosis fixtures.
3. Keep PACT positioning implementation-neutral and cross-domain.

Non-goal:

1. Defining or replacing TM Forum standards.

Additional non-normative base policy profile:

1. `verticals/policy-reference-pack`
2. `fixtures/policy-reference/index.json`
3. `tools/run-policy-reference-fixtures.mjs`

The policy reference profile includes a minimal deny-wins jurisdiction overlay composition example and corresponding fail-closed fixtures.
