# Real-World Deployment Overview (PACT)

This document explains how the public PACT specification surface fits into regulated production environments without prescribing runtime architecture.

## Layered Position

PACT is a semantic governance layer that sits between transport/task exchange and execution.

1. Transport/task layer receives agent task payloads.
2. PACT layer enforces CIC, PSC, OAC, and fail-closed gates.
3. Policy/business layer evaluates domain rules inside the committed semantic boundary.
4. Execution layer performs permitted actions and emits evidence.

## Minimal Operational Flow

1. Intake: task payload arrives from any protocol or workflow framework.
2. Canonicalization: intent is normalized and validated (CIC).
3. Commitment: active pack set is verified and frozen for transaction scope (PSC).
4. Overlay composition: jurisdiction overlays compose with deterministic deny-wins behavior (OAC).
5. Decision: allow/deny outcome produced with normalized reason codes.
6. Evidence: immutable bundle records semantic commitments and decision trace for audit.

## Roles in Production

1. Deployer/operator: selects public or private registries and controls lifecycle updates.
2. Runtime implementer: builds a PACT-compatible validator/enforcer using public contracts.
3. Auditor/regulator: verifies conformance evidence, hash commitments, and deny semantics.
4. Standards participant: extends vertical references without altering core invariants.

## Public vs Private Registry Modes

Both modes are supported by the same conformance baseline.

1. Public registry mode: share packs across ecosystems and partners.
2. Private registry mode: keep pack content internal while preserving PACT contract compatibility.

## What PACT Does Not Standardize

1. orchestration implementation,
2. runtime scaling patterns,
3. policy-business rule content,
4. infrastructure topology.

PACT standardizes safety preconditions and artifact contracts; deployers retain freedom of implementation.
