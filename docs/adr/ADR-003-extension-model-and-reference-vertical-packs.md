# ADR-003: Extension Model and Reference Vertical Packs

Status: Accepted  
Date: March 2, 2026

## Context

PACT must support multi-domain adoption while remaining domain-neutral. Vertical semantics are necessary for demonstration, but should not be mistaken for core normative contracts.

## Decision

PACT uses a two-tier model:

1. Core normative layer: governance invariants + artifact contracts + conformance semantics.
2. Vertical extension layer: non-normative reference packs demonstrating how domains can apply the core layer.

Reference packs in this repository (`verticals/telco-reference-pack`, `verticals/policy-reference-pack`) are demonstrative and non-normative.

Extension requirements:

1. vertical packs MUST not redefine core invariant semantics,
2. vertical packs SHOULD include lineage/provenance notes,
3. vertical packs SHOULD provide both valid and must-fail fixture cases.

## Consequences

1. PACT remains cross-domain and implementation-neutral.
2. Telco-first examples accelerate adoption without making PACT telco-owned.
3. Additional domains (for example finance or healthcare) can be added without changing the core baseline.
