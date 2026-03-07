# Pack-Bounded Authority and External Context

## Purpose
Define a public, implementation-neutral boundary for how external context is used with PACT packs.

## Principle
- Packs are the authority boundary for deterministic execution in a narrow domain slice.
- External context (including RAG and graph retrieval) is advisory.
- Runtime outcomes must remain bounded by the active pack set and fail closed on mismatch.

## Conformance Expectations
Implementations claiming OCI-1 compatibility MUST:
1. Validate artifact schemas, hash chains, signatures, and validity windows fail-closed.
2. Enforce active pack identity/hash pinning for execution.
3. Enforce overlay precedence and deny-wins behavior.
4. Emit stable machine-readable failure codes on verification or boundary violations.

Implementations MAY choose any internal architecture, including:
1. LLM-based planning.
2. Rule engines.
3. RAG or graph sidecars.

Constraint:
- External context MUST NOT silently expand authority outside active pack scope.
- Out-of-scope context MUST resolve to deny or explicit escalation by local governance policy.

## Why This Boundary Exists
- Determinism: same active pack set produces the same conformance result.
- Compliance: governed contracts are enforced before action.
- Interoperability: adopters can build their own agents without changing public PACT semantics.

## Related Public Artifacts
- `docs/architecture/oci-1-contract-profile.md`
- `docs/architecture/real-world-deployment-overview.md`
- `draft-lane2-pact-manifesto-00.md`
- `docs/adr/ADR-001-governance-safety-invariants.md`
