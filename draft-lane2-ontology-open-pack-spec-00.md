Internet-Draft: draft-lane2-ontology-open-pack-spec-00
Intended status: Informational
Expires: 21 August 2026
Individual Submission - Lane2 Architecture

Lane2 Architecture                                        February 21, 2026

# draft-lane2-ontology-open-pack-spec-00 - Open Ontology Pack Specification (OCI-1 Based)

*Status:* Working Draft 0.1
*Editors:* K. Brown et al. (Lane2 Architecture)
*Date:* 2026-02-21

## Abstract
This document defines an open specification for ontology pack distribution and runtime verification based on the current OCI-1 contract shape implemented in this repository. It standardizes wire artifacts, API operations, verification behavior, conformance expectations, and versioning rules for interoperable non-DOP and DOP consumers.

## 1. Purpose
Provide a public, implementation-facing specification from existing production-oriented contract artifacts so any agent platform can consume ontology packs safely and consistently.

## 2. Normative Source of Truth (Code-Shaped)
This draft is derived from these repository contracts:
- `docs/architecture/oci-1-profile.json`
- `docs/architecture/oci-1-contract-profile.md`
- `schemas/pack-descriptor.schema.json`
- `schemas/bundle-manifest.schema.json`
- `schemas/pack-index.schema.json`
- `schemas/intent-mappings.schema.json`
- `schemas/entity-patterns.schema.json`
- `schemas/convergence-fixtures.schema.json`
- `schemas/promotion-gate-result.schema.json`
- `schemas/delivery-profile.schema.json`

ONTOSPEC-REQ-001: Implementations claiming OCI-1 compatibility **MUST** validate against the schema set above.

## 3. Conformance Classes
### 3.1 Publisher
Produces `pack.json`, `bundle.json`, `obt.jws`, and index entries.

### 3.2 Registry
Publishes discovery and pack files over static HTTP paths.

### 3.3 Consumer
Fetches and verifies pack artifacts fail-closed.

### 3.4 Runtime Enforcer
Pins active pack hash/version and blocks execution on mismatch.

## 4. Distribution API (Open)
Required operations:
- `GET /index.json`
- `GET /{domain}/pack.json`
- `GET /{domain}/bundle.json`
- `GET /{domain}/obt.jws`
- `GET /{domain}/{filename}`

Optional policy-gate operations for binding/attestation:
- `GET /policy/snapshot`
- `POST /ontology/bind`
- `POST /attest` (primary)
- `POST /attestation` (compatibility alias)

ONTOSPEC-REQ-010: Registry implementations **MUST** support the five required distribution operations.

## 5. Wire Artifact Contracts
### 5.1 `pack.json` (Descriptor)
Normative schema:
- `schemas/pack-descriptor.schema.json`

Key characteristics:
- snake_case fields;
- includes DC provenance block (`dc`);
- contains logical key -> filename mapping.

### 5.2 `bundle.json` (Manifest)
Normative schema:
- `schemas/bundle-manifest.schema.json`

Key characteristics:
- camelCase fields;
- contains logical key -> SHA-256 hash mapping;
- does not include `dc`.

### 5.3 `obt.jws` (Signature)
EdDSA compact JWS over canonical bundle payload.

ONTOSPEC-REQ-020: Consumers **MUST** reject bundles where `obt.jws` signature verification fails.

## 6. Verification Sequence
Required fail-closed sequence:
1. Fetch `pack.json`, `bundle.json`, `obt.jws`.
2. Verify OBT signature and key trust.
3. For each file hash entry, fetch mapped file and verify `sha256`.
4. Verify validity window and revocation epoch semantics.
5. Promote to verified pack only when all checks pass.

ONTOSPEC-REQ-030: Partial verification success **MUST NOT** be accepted.

## 7. Pack Semantics and Determinism
### 7.1 Intent Mapping Contract
Use `schemas/intent-mappings.schema.json`:
- deterministic `concept_uri -> intent_class` mappings;
- explicit `confidence_floor`.

### 7.2 Entity Pattern Contract
Use `schemas/entity-patterns.schema.json`:
- pattern binding to concept URIs;
- normalization metadata.

### 7.3 Convergence Fixture Contract
Use `schemas/convergence-fixtures.schema.json`:
- deterministic phrase-to-intent expectations;
- optional threshold gates.

ONTOSPEC-REQ-040: High-impact unresolved mapping conflicts **MUST** block regulated promotion.

## 8. Versioning and Compatibility
Baseline version:
- OCI contract profile version `1.0` (from `docs/architecture/oci-1-profile.json`).

Rules:
- additive backward-compatible changes are minor;
- semantic breaks require major version increment;
- no unversioned breaking contract change.

ONTOSPEC-REQ-050: Consumers **MUST** reject unsupported major contract versions.

## 9. Error Contract
Stable machine-readable reason codes should be used for failures, aligned with:
- `docs/architecture/oci-1-error-map.json`
- `schemas/promotion-gate-result.schema.json`

ONTOSPEC-REQ-060: Conformance failures **MUST** emit stable, language-neutral error codes.

## 10. Governance Binding
Open specification does not imply open activation authority.

Regulated activation should require:
- signed promotion artifacts;
- governance approval;
- active manifest hash publication.

ONTOSPEC-REQ-070: Runtime regulated execution **MUST** fail closed on pack hash/version mismatch with active signed state.

## 11. Open Standard Adoption Guidance
To support non-DOP consumers:
1. Implement distribution API and schemas as-is.
2. Implement verification sequence fail-closed.
3. Implement pack hash pinning at runtime.
4. Participate in conformance test fixtures and public interoperability runs.

## 12. Relation to Companion Drafts
This open spec aligns with:
- `draft-lane2-ontology-open-standard-transition-00.md`
- `draft-lane2-operational-ontology-profile-00.md`
- `draft-lane2-ontology-pack-governance-00.md`
- `draft-lane2-ontology-pack-conformance-00.md`
- `draft-lane2-ontology-certification-and-trust-mark-00.md`
