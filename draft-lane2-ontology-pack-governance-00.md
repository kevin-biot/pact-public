Internet-Draft: draft-lane2-ontology-pack-governance-00
Intended status: Informational
Expires: 21 August 2026
Individual Submission - Lane2 Architecture

Lane2 Architecture                                        February 21, 2026

# draft-lane2-ontology-pack-governance-00 - Ontology Pack Governance for Regulated Agent Systems

*Status:* Working Draft 0.1
*Editors:* K. Brown et al. (Lane2 Architecture)
*Date:* 2026-02-21

## Abstract
This document defines governance for ontology packs used by agents in regulated and non-regulated corridors. It introduces a two-layer control model: regulator authority for legal admissibility and consortium authority for technical authoring and conformance. It specifies pack classes, rights boundaries, lifecycle states, required artifacts, and activation controls.

## 1. Purpose
Ontology packs increasingly drive agent behavior and policy interpretation. In regulated systems, pack governance must preserve legal authority while enabling technical iteration.

This document defines:
- who can author packs;
- who can approve and activate packs;
- what evidence is needed for promotion;
- how to prevent unilateral control.

## 2. Governance Principles
`G1` Legal authority and technical authoring are separate roles.  
`G2` Regulated pack activation requires regulator approval.  
`G3` Every promotion step is signed, auditable, and replayable.  
`G4` Runtime execution fails closed on missing/mismatched active pack state.

ONTO-GOV-REQ-001: No actor **MUST** unilaterally activate a regulated core pack.

## 3. Governance Roles
### 3.1 Regulator Authority (RA)
Defines legal admissibility and approval policy for regulated pack classes.

### 3.2 Consortium Governance Board (CGB)
Coordinates multi-party technical authoring, review, and release readiness.

### 3.3 Pack Maintainer Group (PMG)
Authors ontology content, mappings, and tests.

### 3.4 Independent Conformance Operator (ICO)
Executes conformance suites and publishes signed results.

### 3.5 Runtime Operator (RO)
Distributes active packs to runtime systems without sovereign override rights.

ONTO-GOV-REQ-010: Role rights **MUST** be declared in a signed rights matrix per pack class.

## 4. Pack Classes
### 4.1 `RegCore`
Regulator-constrained baseline packs for regulated domains.

### 4.2 `IndustryProfile`
Consortium-managed sector packs aligned to `RegCore`.

### 4.3 `LocalOverlay`
Jurisdiction/corridor-specific overlays that narrow or adapt behavior.

ONTO-GOV-REQ-020: `IndustryProfile` and `LocalOverlay` packs **MUST NOT** weaken active `RegCore` constraints.

## 5. Decision Rights by Pack Class
| Action | RegCore | IndustryProfile | LocalOverlay |
|--------|---------|-----------------|--------------|
| Author content | PMG/CGB | PMG/CGB | PMG + local authority |
| Technical review | CGB + ICO | CGB + ICO | CGB/ICO + local authority |
| Legal admissibility | RA required | Optional unless regulated use | Required for regulated use |
| Activation approval | RA + CGB co-sign | CGB sign (RA when regulated) | Local authority + CGB (RA when regulated) |
| Emergency suspension | RA or delegated legal authority | CGB or local authority | Local legal authority |

ONTO-GOV-REQ-030: Any pack used in regulated execution **MUST** have legal admissibility approval by competent authority.

## 6. Pack Lifecycle
States:
1. `DRAFT`
2. `REVIEW`
3. `CANDIDATE`
4. `APPROVED`
5. `ACTIVE`
6. `DEPRECATED`
7. `REVOKED`

ONTO-GOV-REQ-040: Regulated packs **MUST** pass through lifecycle states in order except emergency revocation.

ONTO-GOV-REQ-041: Emergency revocation **MUST** include signed reason code and appeal window.

## 7. Required Artifact Set
Minimum artifacts per pack version:
- ontology source bundle;
- mapping pack(s);
- constraint/shape definitions;
- test suite and signed conformance report;
- signed pack manifest with hashes and validity window;
- promotion signoff and audit chain.

ONTO-GOV-REQ-050: Runtime activation **MUST** reference an immutable pack manifest hash.

## 8. Activation Rules
Regulated activation gate requires:
1. signed legal admissibility decision;
2. signed conformance pass report;
3. signed promotion bundle;
4. active manifest publication with effective time.

ONTO-GOV-REQ-060: If any activation artifact is missing or invalid, pack status **MUST** remain non-active.

## 9. Runtime Consumption Rules
Runtime systems should consume:
- `pack_id`
- `pack_version`
- `pack_hash`
- `effective_window`
- `rev_epoch`

ONTO-GOV-REQ-070: Runtime execution **MUST** fail closed when active pack hash does not match signed manifest.

## 10. Non-Centralization Guardrail
Consortium coordination is permitted. Sovereign legal control for regulated packs cannot be centralized.

ONTO-GOV-REQ-080: A technical platform operator **MUST NOT** unilaterally activate, widen, or reinstate regulated pack authority.

## 11. Relation to Existing Ontology Tooling
This governance model should integrate with:
- `cmd/ontology-tool` promotion and validation commands;
- promotion bundle signing and verification flow;
- policy-gate and runtime pack integrity checks.

## 12. Next Documents
Companion drafts:
- `draft-lane2-ontology-pack-conformance-00.md`
- `draft-lane2-ontology-pack-authoring-and-approval-workflow-00.md`
