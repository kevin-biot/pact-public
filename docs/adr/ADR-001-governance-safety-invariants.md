# ADR-001: Governance Safety Invariants

Status: Accepted  
Date: March 2, 2026

## Context

Regulated agent execution requires a constitutional baseline that is enforceable before any state-changing action. Prompt formats and transport protocols are necessary, but insufficient for deterministic safety and replayable accountability.

## Decision

PACT defines the following minimum pre-execution invariants:

1. `Canonical Intent Contract (CIC)`: execution must use canonicalized, structurally valid intent.
2. `PackSet Commitment Contract (PSC)`: execution must bind to a frozen, hash-committed pack set.
3. `Overlay Authority Contract (OAC)`: overlays compose deterministically with deny-wins and cannot silently expand authority.
4. `Fail-Closed Enforcement`: ambiguity, signature mismatch, pack drift, or contract mismatch denies execution.

## Consequences

1. Conformance requires deterministic deny behavior when invariants are violated.
2. Governance semantics are separated from policy-business logic; PACT constrains the safety envelope, not domain policy content.
3. Transport-level interoperability can be layered with PACT without redefining transport protocols.
