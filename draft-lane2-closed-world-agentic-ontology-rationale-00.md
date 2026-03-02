Internet-Draft: draft-lane2-closed-world-agentic-ontology-rationale-00
Intended status: Informational
Expires: 21 August 2026
Individual Submission - Lane2 Architecture

Lane2 Architecture                                        February 21, 2026

# draft-lane2-closed-world-agentic-ontology-rationale-00 - Closed-World Agentic Ontologies: Rationale and Safety Case

*Status:* Working Draft 0.1
*Editors:* K. Brown et al. (Lane2 Architecture)
*Date:* 2026-02-21

## Abstract
This document explains why closed-world, action-focused ontology packs are required for safe agent execution in regulated and high-risk environments. It contrasts this model with broad open-world ontology approaches, clarifies interoperability boundaries, and shows how wide ontologies can still be used as source material without compromising deterministic runtime safety.

## 1. Purpose
This document provides a direct policy and technical rationale for the Lane2 ontology model:
- narrow, execution-safe ontology packs;
- deterministic mapping and bounded behavior;
- open specification without vendor lock-in.

## 2. Core Position
Open-world ontology programs are valuable for broad semantic modeling.  
Agent runtime execution, especially in regulated contexts, requires closed-world constraints.

Closed-world pack model:
- explicit action scope;
- explicit constraints;
- deterministic outputs;
- fail-closed behavior.

CWAR-REQ-001: Regulated agent execution **MUST NOT** rely solely on unconstrained open-world inference.

## 3. Problem Statement: Why Classic Open-World Alone Is Not Enough
Classic ontology initiatives often optimize for:
- global semantic completeness;
- broad reuse across domains;
- open-ended inferencing.

These goals conflict with runtime agent safety requirements:
- ambiguous inference paths;
- non-deterministic edge behavior;
- unclear legal accountability boundaries;
- difficult conformance/replay guarantees.

## 4. Threat Model
In agentic systems, unsafe ontology behavior can cause:
- scope drift (agent acts outside approved capability);
- policy bypass via semantic ambiguity;
- irreproducible decisions;
- post-incident non-auditability.

CWAR-REQ-010: Any ontology model used in regulated execution **MUST** support deterministic replay and signed provenance.

## 5. Closed-World Agentic Ontology Model
The model uses bounded pack artifacts for runtime:
- `pack_id`, `pack_version`, `pack_hash`;
- constrained `action_set`;
- constrained mapping rules;
- signed effective window and revocation state.

Runtime behavior is pinned to active signed pack state, not free-form model interpretation.

CWAR-REQ-020: Runtime systems **MUST** fail closed on pack identity/hash mismatch.

## 6. Open-World Compatibility Without Runtime Drift
Open-world ontologies are still useful:
- as upstream semantic source material;
- for discovery and interoperability mappings;
- for broad conceptual alignment.

But they should be compiled into operational packs before execution.

Recommended pipeline:
1. Broad ontology source (open-world).
2. Controlled derivation to domain pack.
3. Governance and conformance gating.
4. Signed runtime activation.

CWAR-REQ-030: Open-world sources **MAY** inform pack content, but **MUST NOT** override active operational constraints at runtime.

## 7. Narrow Agents as a Safety Strategy
Narrow agents reduce blast radius by limiting:
- action vocabulary;
- decision space;
- scope of policy interpretation.

Ontology packs should reinforce narrowness:
- explicit intent mappings;
- explicit capability boundaries;
- explicit policy compatibility.

CWAR-REQ-040: Agent capability expansion **MUST** require explicit pack change approval, not implicit semantic drift.

## 8. Anti-Lock-In Position
The model is not lock-in when:
- contracts are open;
- schemas are public;
- conformance is public;
- runtime verification rules are standard.

Commercial differentiation remains in:
- superior authoring workflows;
- faster compliant release cycles;
- managed regulator-grade operations.

CWAR-REQ-050: Open specification and conformance artifacts **SHOULD** remain vendor-neutral and publicly implementable.

## 9. Expected Critique and Response
Critique: closed-world packs are "too narrow" and "not true ontology".  
Response: runtime safety and legal accountability require bounded semantics for execution.

Critique: broad ontologies are more future-proof.  
Response: broad ontologies are upstream assets; operational packs are controlled downstream execution profiles.

Critique: open standards remove commercial advantage.  
Response: standards commoditize interfaces, not operational excellence, compliance velocity, or managed trust.

## 10. Decision Rule for Deployments
If a deployment cannot:
1. deterministically replay ontology-driven decisions,
2. prove signed pack provenance,
3. enforce fail-closed on mismatch,
then it is not acceptable for regulated agent execution.

## 11. Relation to Companion Drafts
This rationale supports:
- `draft-lane2-ontology-open-standard-transition-00.md`
- `draft-lane2-operational-ontology-profile-00.md`
- `draft-lane2-ontology-pack-governance-00.md`
- `draft-lane2-ontology-pack-conformance-00.md`
- `draft-lane2-ontology-open-pack-spec-00.md`

## 12. Next Step
Add a formal "closed-world safety profile" test suite to conformance gates with explicit anti-drift and anti-scope-creep checks.
