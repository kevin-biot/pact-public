Internet-Draft: draft-lane2-ontology-pack-conformance-00
Intended status: Informational
Expires: 21 August 2026
Individual Submission - Lane2 Architecture

Lane2 Architecture                                        February 21, 2026

# draft-lane2-ontology-pack-conformance-00 - Ontology Pack Conformance Profile

*Status:* Working Draft 0.1
*Editors:* K. Brown et al. (Lane2 Architecture)
*Date:* 2026-02-21

## Abstract
This document defines conformance requirements for ontology packs used in regulated and consortium-governed agent environments. It specifies test suites, pass/fail thresholds, traceability requirements, and release gating criteria for pack promotion.

## 1. Purpose
Ontology pack activation must be evidence-driven. This profile defines the minimum conformance envelope before a pack can move to `ACTIVE`.

## 2. Scope
In scope:
- `RegCore`, `IndustryProfile`, and `LocalOverlay` pack classes;
- schema and mapping correctness;
- policy compatibility and runtime integrity.

## 3. Test Suites
### Suite A - Structural Integrity
Checks manifest, schema versions, file hashes, and signature format.

### Suite B - Semantic Integrity
Checks ontology consistency, term conflicts, and prohibited concept drift.

### Suite C - Mapping Integrity
Checks mapping completeness, unresolved high-impact mappings, and determinism.

### Suite D - Policy Compatibility
Checks compatibility against active `RegCore` constraints and legal rules.

### Suite E - Runtime Safety
Checks fail-closed behavior on missing/mismatched pack metadata.

### Suite F - Non-Centralization Guardrails
Checks that regulated activation cannot occur without required co-sign approvals.

### Suite G - Closed-World Safety Profile
Checks that runtime behavior remains bounded to approved action scope and does not drift via implicit semantic expansion.

Closed-World Safety Profile controls include:
- anti-drift: no silent semantic or mapping behavior drift without governed version/promotion;
- anti-scope-creep: no execution outside approved action and constraint boundaries.

ONTO-CONF-REQ-001: Suites D, E, F, and G are always Critical for regulated packs.

ONTO-CONF-REQ-002: Regulated pack promotion **MUST** include a signed Closed-World Safety Profile result.

## 4. Minimum Case Matrix
| Case ID | Suite | Objective | Expected Result |
|---------|-------|-----------|-----------------|
| `ONTO-A-001` | A | Validate manifest hash-chain | Pass only if all hashes match |
| `ONTO-B-001` | B | Detect conflicting normative terms | Reject on unresolved conflict |
| `ONTO-C-001` | C | Detect unresolved high-impact mappings | Reject promotion |
| `ONTO-D-001` | D | Validate compatibility with active `RegCore` | Reject weakening overlay |
| `ONTO-E-001` | E | Simulate missing active pack hash at runtime | Fail closed |
| `ONTO-F-001` | F | Attempt regulated activation without regulator co-sign | Deny |
| `ONTO-G-001` | G | Detect semantic drift against prior active pack without approved version transition | Reject promotion |
| `ONTO-G-002` | G | Detect new executable actions not declared in approved `action_set` | Reject promotion (anti-scope-creep) |
| `ONTO-G-003` | G | Detect constraint relaxation that widens runtime behavior outside approved profile | Reject promotion (anti-scope-creep) |
| `ONTO-G-004` | G | Simulate runtime request outside active bounded scope | Fail closed with stable reason code |

## 5. Pass/Fail Policy
Thresholds:
- Critical suites: 100% pass.
- Non-critical suites: >= 95% pass with no unresolved high-risk defects.

ONTO-CONF-REQ-010: Any failed critical case **MUST** result in `NO-GO`.

## 6. Re-Run Triggers
At minimum rerun Critical suites after:
- ontology source changes;
- mapping changes;
- legal/policy baseline updates;
- signing key changes;
- revocation epoch changes.
- action/constraint set changes;
- any change affecting bounded runtime scope.

ONTO-CONF-REQ-020: Reruns **MUST** occur before promotion when any trigger event is present.

## 7. Evidence Requirements
Each test run should produce:
- signed run manifest;
- per-case decision and reason code;
- pack/version/hash references;
- trace IDs and timestamps;
- signer and verifier identifiers.

ONTO-CONF-REQ-030: Missing evidence for a critical case **MUST** invalidate the result.

## 8. Traceability
Each conformance case should map to one or more governance requirements in:
- `draft-lane2-ontology-pack-governance-00.md`
- corridor governance and admission policies where applicable.

ONTO-CONF-REQ-040: Cases without requirement traceability **MUST NOT** count toward release qualification.

## 9. Output Artifacts
Recommended outputs:
- `ontology-conformance-plan.yaml`
- `ontology-conformance-run-<date>.json`
- `ontology-defects.json`
- `ontology-evidence-index.json`
- `ontology-go-no-go-report.md`

## 10. Integration with Existing Tooling
Conformance flow should integrate with:
- `cmd/ontology-tool validate`
- `cmd/ontology-tool promotion-gate`
- promotion bundle signing and verification commands.

## 11. Release Gate Rule
ONTO-CONF-REQ-050: Regulated pack promotion to `ACTIVE` **MUST** require signed `GO` recommendation from both technical conformance authority and legal admissibility authority.

ONTO-CONF-REQ-051: Regulated pack promotion to `ACTIVE` **MUST** fail when Closed-World Safety Profile critical cases (`ONTO-G-*`) are incomplete or failing.
