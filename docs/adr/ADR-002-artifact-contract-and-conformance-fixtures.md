# ADR-002: Artifact Contract and Conformance Fixture Model

Status: Accepted  
Date: March 2, 2026

## Context

Specification claims are only useful if third parties can verify them without private code. PACT needs a normative artifact set plus executable conformance fixtures that are implementation-neutral.

## Decision

OCI-1 compatibility claims MUST validate against the published schema/profile baseline and SHOULD run the conformance fixture harnesses:

1. `docs/architecture/oci-1-profile.json`
2. `docs/architecture/oci-1-contract-profile.md`
3. `schemas/*.schema.json` in normative baseline list (see README)
4. fixture sets under `fixtures/oci1/`, `fixtures/telco-reference/`, and `fixtures/policy-reference/`
5. verifier tools under `tools/`.

Fixture model requirements:

1. include at least one valid baseline case,
2. include must-fail cases for hash mismatch, signature mismatch, schema failures, and overlay deny-wins violations,
3. normalize error codes via `docs/architecture/oci-1-error-map.json`.

## Consequences

1. Any implementation can self-test conformance without access to private runtime code.
2. Standards discussions can be grounded in reproducible pass/fail behavior.
3. Specification drift becomes detectable through fixture regressions.
