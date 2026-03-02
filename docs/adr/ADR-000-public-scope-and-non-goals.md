# ADR-000: Public Scope and Non-Goals

Status: Accepted  
Date: March 2, 2026

## Context

`pact-public` is intended to publish an implementation-neutral specification surface for regulated agent governance. Earlier drafts and tooling references exist, but implementers need an explicit statement of what this repository does and does not standardize.

## Decision

The public repository scope is:

1. governance invariants,
2. artifact contracts and schemas,
3. conformance fixtures and verifier harnesses,
4. reference pack examples that are explicitly non-normative.

The public repository non-goals are:

1. runtime server architecture,
2. orchestration engine behavior,
3. internal deployment topology,
4. private keys, private registries, and operator-specific policies.

## Consequences

1. Independent implementations can claim compatibility by validating against public contracts and fixtures.
2. Runtime product differentiation remains outside the specification baseline.
3. Public standards discussions stay focused on conformance and safety properties, not vendor internals.
