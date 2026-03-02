# OCI-1 Contract Profile

**Version:** 1.0  
**Status:** Draft baseline  
**Authority:** `docs/ADR/ADR-028-client-interface-contract-and-adapter-boundary.md`

## 1. Contract Authority

OCI-1 is defined by these artifacts:

0. Machine-readable profile and version gate root:
   - `docs/architecture/oci-1-profile.json`

1. Distribution API and trust flow:
   - `docs/ADR/ADR-016-pack-distribution-api.md`
   - `docs/ADR/ADR-017-obt-token-specification.md`
2. Pack wire schemas:
   - `schemas/pack-descriptor.schema.json`
   - `schemas/bundle-manifest.schema.json`
   - `schemas/pack-index.schema.json`
   - `schemas/intent-mappings.schema.json`
   - `schemas/entity-patterns.schema.json`
   - `schemas/convergence-fixtures.schema.json`
3. Deterministic execution and convergence obligations:
   - `docs/ADR/ADR-024-ontology-convergence-tests.md`
   - `docs/ADR/ADR-026-agentic-ontology-execution-invariants.md`

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

1. OBT signature, key selection, and payload verification are fail-closed.
2. Canonicalization checks must be equivalent across client implementations.
3. Bundle/time/revocation checks use deterministic machine outcomes.
4. Error codes are stable and language-neutral (see `docs/architecture/oci-1-error-map.json`).

## 5. Versioning

1. Minor additions are backward-compatible.
2. Breaking semantic changes require OCI major version bump.
3. No unversioned contract break is allowed on main.
4. CI enforces a version gate via `scripts/check-oci-version-gate.sh` when OCI contract files change.
