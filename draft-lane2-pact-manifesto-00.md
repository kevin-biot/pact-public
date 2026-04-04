Internet-Draft: draft-lane2-pact-manifesto-00
Intended status: Informational
Expires: 2 September 2026
Individual Submission - Lane2 Architecture

Lane2 Architecture                                        March 2, 2026

# draft-lane2-pact-manifesto-00 - PACT: Pack-based Agentic Contract for Trust

*Status:* Working Draft 0.1

## Abstract

PACT (Pack-based Agentic Contract for Trust) defines minimum constitutional invariants for safe, deterministic, and auditable execution of regulated agent systems. It standardizes semantic commitment, version freeze, overlay authority control, and fail-closed enforcement prior to execution.

PACT uses a deliberately lightweight technology stack: SKOS for vocabulary, SHACL for structural validation, JSON-LD for context, Dublin Core for provenance, and EdDSA-signed JSON packs for distribution and trust. It does not require OWL reasoners, triple stores, or SPARQL endpoints.

This document is the entry point for a governance safety baseline. Companion drafts provide specification, governance, conformance, and operational detail.

---

## 0. Conventions and Terminology

The key words "MUST", "MUST NOT", "SHOULD", "SHOULD NOT", and "MAY" in this
document are to be interpreted as described in BCP 14 (RFC 2119) and RFC 8174
when, and only when, they appear in all capitals, as shown here.

## 0.1 Current Validation Scope

PACT core contracts (artifact shape, deterministic verification, fail-closed gates, and evidence linkage) are implemented and validated in this repository. Vertical profiles are intentionally staged: resource/topology semantics are stronger today than full agentic domain depth. Profile capability artifacts define what is currently validated versus planned, and claims MUST stay within that declared scope.

---

## 1. Problem Statement

Agentic systems are executing regulated actions, not just answering questions. An agent that provisions a network slice, initiates a payment, or modifies a patient record is making commitments with legal, financial, and operational consequences. Execution at this level requires contracts, not context.

The current market often treats retrieval and prompt shaping as governance. These approaches are useful for discovery and task routing. They are not constitutional safety controls.

Without hard pre-execution invariants, regulated agent systems drift in unsafe ways:

1. mutable semantics during execution,
2. implicit authority expansion through overlays or prompt interpretation,
3. ambiguous intent admitted to runtime,
4. incomplete evidence chains that break audit replay.

The gap is structural. There is no lightweight, deterministic, auditable baseline that defines the minimum governance floor before regulated execution.

PACT fills this gap.

---

## 2. Baseline Position

1. PACT defines the minimum governance invariants required for regulated agent certification.
2. Semantic contracts serve regulated execution, not semantic completeness.
3. Policy and law govern authority; ontology governs meaning.
4. Evidence governs accountability; determinism governs interoperability.
5. Retrieval and prompting may assist ingress, but cannot replace governance gates.

If a semantic proposal undermines any of the above, it is rejected.

**PACT-REQ-001:** A PACT-conformant system MUST enforce baseline governance invariants before permitting regulated agent execution.

---

## 3. Constitutional Authority Stack

Authority flows in one direction only:

`Law -> Policy -> Orchestration -> Execution -> Reasoning`

Reasoning may explain and recommend. Reasoning does not authorize.

Ontology defines the semantic space within which authorized operations exist. Ontology does not grant authority. Ontology does not replace policy engines, legal identity controls, or corridor admission gates. Ontology metadata cannot bypass control-plane enforcement.

**PACT-REQ-002:** Authority MUST flow from law through policy to execution. Ontology semantics MUST NOT be treated as implicit authority grants.

### 3.1 Governance Gate Position

PACT operates as a pre-execution governance gate. Upstream layers (reasoning, tooling, transport, policy) may propose and evaluate candidate actions. PACT gates execution admission through canonicalization, commitment, overlay, and fail-closed checks. Execution proceeds only after PACT admission succeeds.

PACT does not prescribe the architecture of surrounding layers. Implementations position the governance gate according to their own runtime design.

---

## 4. Five Constitutional Baseline Invariants

PACT defines five constitutional baseline invariants that bind all regulated execution.

### 4.1 Baseline 1: Canonical Meaning Precondition (CIC)

No regulated execution may proceed unless intent is canonicalized into a structurally valid, unambiguous, version-bound form.

Canonicalization precedes authorization. Always.

Canonical intent MUST pass structural validation, contain required domain fields, use enumerated canonical values where defined, and be version-bound to the committed pack set.

Reasoning may recommend interpretations. Reasoning may not silently repair structural defects.

Ambiguity outcome MUST be DENY or ESCALATE. Never silent reinterpretation.

**PACT-REQ-003:** Regulated execution MUST NOT proceed on un-canonicalized, ambiguous, or unbound intent.

### 4.2 Baseline 2: Frozen Semantic State (PSC)

Every regulated transaction executes against a frozen, hash-committed pack set.

The pack set is admitted at transaction boundary. Once admitted, the pack set is immutable for the duration of execution. Pack version drift during execution is prohibited.

Commitment is cryptographic (SHA-256 content hashes verified against EdDSA-signed bundle manifests), not semantic. If the hash does not match, execution is rejected. There is no "close enough."

**PACT-REQ-004:** Execution MUST bind to a frozen, hash-verified pack set. Mid-execution pack drift MUST be rejected deterministically.

### 4.3 Baseline 3: Authority Separation

Semantic definition does not grant authority. Policy remains sovereign.

Ontology defines admissible meaning and structure. It does not authorize execution by itself.

**PACT-REQ-005:** Semantic models and mappings MUST NOT be treated as implicit authority grants; policy decisions remain authoritative.

### 4.4 Baseline 4: Deterministic Overlay (OAC)

Overlays constrain; overlays do not silently expand authority.

Jurisdiction and domain overlays compose deterministically with deny-wins precedence. An overlay may restrict base pack concepts, add jurisdiction-specific constraints, or narrow the valid operation set. An overlay may not silently widen authority, introduce new base concepts without explicit versioning, or override deny-wins resolution.

Any authority-expanding change requires explicit policy grant, version increment, conformance evidence, and audit record.

**PACT-REQ-006:** Overlays MUST NOT expand authority without explicit policy grant. Deny-wins resolution MUST be deterministic and auditable.

### 4.5 Baseline 5: Fail-Closed Enforcement

Ambiguity, mismatch, signature failure, or missing evidence blocks regulated execution.

Absence of evidence is disqualifying, not neutral.

**PACT-REQ-007:** PACT-conformant systems MUST be fail-closed at every governance gate.

---

## 5. Technology Posture

PACT adopts a deliberately lightweight technology stack:

- **SKOS** for vocabulary. Concepts, labels, broader/narrower relations. No description logic.
- **SHACL** for structural validation. Datatype conformance, cardinality, required fields. SHACL does not encode behavioral policy or risk decisions.
- **JSON-LD** for context. Namespace alignment without requiring RDF infrastructure.
- **Dublin Core** for provenance. Required for publication audit. Not the semantic root model.
- **EdDSA compact JWS** for trust. Ontology Bundle Tokens (OBTs) sign SHA-256 hash-linked bundle manifests with Ed25519 keys.

This stack optimizes for deterministic execution in bounded domains. It does not optimize for open-world inference, theoretical completeness, or query-time reasoning.

If a system requires a SPARQL endpoint or OWL reasoner to consume a PACT pack, the system is not PACT-conformant. The pack must be consumable with JSON parsing, hash verification, and SHACL structural checks.

---

## 6. What PACT Governs

PACT codifies nine governance shapes. Each is specified in companion drafts; this section provides the map.

| Shape | What it governs | Companion |
|---|---|---|
| **Pack** | Minimal profile: domain, version, trust tier, file manifest, DC provenance | Operational Profile |
| **Distribution** | 3-layer HTTP API: index, descriptor+manifest+signature, content files | Open Pack Spec |
| **Trust** | EdDSA compact JWS over bundle manifest with SHA-256 file hashes | Open Pack Spec |
| **Wire** | Deterministic field conventions: snake_case in descriptors, camelCase in manifests | Open Pack Spec |
| **Client** | OCI-1 contract: cross-language parity for verification and error codes | Open Pack Spec |
| **Overlay** | Jurisdiction overlays with deterministic precedence, deny-wins composition | Governance |
| **Governance** | Multi-party separation of legal authority and technical authoring | Governance |
| **Error** | Machine-readable, language-neutral error codes; deterministic across implementations | Conformance |
| **Temporal** | nbf/exp/revEpoch validity windows with fail-closed enforcement | Open Pack Spec |

---

## 7. What PACT Is Not

PACT is not an ontology research program. It does not pursue semantic completeness.

PACT is not a replacement for policy engines. Ontology defines meaning; policy engines enforce authority. These are different systems with different lifecycles.

PACT is not a retrieval framework. Retrieval may coexist upstream as a discovery mechanism. PACT governs what retrieval produces before execution proceeds.

PACT is not vendor-locked. Pack specifications, wire contracts, conformance profiles, and error taxonomies are open. Commercial differentiation operates at the level of operational excellence, compliance velocity, and managed trust services, not interface lock-in.

PACT is not a heavyweight OWL/RDF/SPARQL mandate. If it requires a triple store to deploy, it has left the PACT boundary.

---

## 8. Retrieval and Reasoning Boundary

PACT does not prohibit retrieval, prompting, or reasoning layers. It constrains their output before execution.

Retrieval and reasoning are admissible upstream inputs when all baseline invariants are still enforced prior to execution.

A retrieved result does not itself satisfy:

1. canonicalization requirements,
2. frozen pack commitment,
3. authority separation,
4. deterministic overlay control,
5. fail-closed evidence gates.

PACT is therefore complementary to policy engines and compatible with retrieval tooling, while remaining stricter on execution admission.

---

## 9. Vertical Extension Model

PACT core defines artifact contracts, invariant enforcement hooks, and governance gates. It is domain-agnostic.

Vertical profiles extend PACT core with domain-specific vocabularies, SHACL shapes, intent mappings, and crosswalks to external standards. Verticals extend; verticals do not modify core normative contracts.

The telco vertical profile demonstrates this model. It integrates 3GPP TS 28.541 resource models, TM Forum SID and Open API catalog mappings, ONF TAPI transport topology, and IETF network topology standards through the same deterministic batch onboarding, build, validate, sign, and promote pipeline that PACT core defines.

Healthcare, finance, and other regulated domains follow the same extension pattern: domain sources enter through batch onboarding, produce signed packs, and are governed by the same constitutional invariants.

---

## 10. Fail-Closed Safety Posture

PACT systems are fail-closed at every decision gate.

- On ambiguity: deny or escalate. Never silently interpret.
- On pack mismatch: reject execution. Never proceed with stale or unverified semantic state.
- On missing evidence: block promotion. Never assume compliance from absence.
- On overlay conflict: deny-wins. Never resolve toward expanded authority.
- On signature failure: reject the pack. No partial acceptance.

---

## 11. Relation to Companion Drafts

This manifesto is supported by the following companion specifications:

1. `draft-lane2-closed-world-agentic-ontology-rationale-00` -- Closed-World Agentic Ontologies: Rationale and Safety Case
2. `draft-lane2-ontology-pack-governance-00` -- Ontology Pack Governance for Regulated Agent Systems
3. `draft-lane2-ontology-open-standard-transition-00` -- Ontology Open Standard Transition Strategy
4. `draft-lane2-ontology-open-pack-spec-00` -- Open Ontology Pack Specification (OCI-1 Based)
5. `draft-lane2-ontology-pack-authoring-and-approval-workflow-00` -- Ontology Pack Authoring and Approval Workflow
6. `draft-lane2-ontology-pack-conformance-00` -- Ontology Pack Conformance Profile
7. `draft-lane2-operational-ontology-profile-00` -- Operational Ontology Profile for Deterministic Agent Execution
8. `draft-lane2-ontology-certification-and-trust-mark-00` -- Ontology Certification and Trust Mark Framework

Companion drafts SHOULD include explicit traceability mapping from local requirement identifiers (for example, `ONTO-*` and `CWAR-*`) to the relevant PACT invariants (`PACT-REQ-001` through `PACT-REQ-007`), either inline or in a dedicated appendix.

Changes to companion drafts that conflict with PACT invariants require manifesto-level review.

---

## 12. Reviewer Guidance

When reviewing proposals against the PACT standard:

1. Choose deterministic safety over semantic breadth.
2. Choose governed execution admission over prompt flexibility.
3. Choose authority-separation and deny-wins overlays over convenience merges.
4. Choose replayable evidence over inferred compliance.
5. Choose fail-closed behavior over optimistic interpretation.

Any proposed extension must improve deterministic execution or auditability, have bounded schema impact, preserve replay determinism, and include conformance tests with failure modes. If it does not, the extension is out of scope.

This is a governance safety baseline for regulated agent ecosystems.
