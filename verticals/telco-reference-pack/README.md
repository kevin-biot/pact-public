# Telco Governance Reference Pack (Non-Normative)

This pack is a minimal, non-normative vertical profile that demonstrates PACT extension mechanics for telco fault-diagnosis governance.

It is intentionally narrow:

1. One task type (`FaultDiagnosis`).
2. One canonical intent class (`fault.diagnosis.request.v1`).
3. One mandatory target object identifier.
4. One mandatory fault occurrence timestamp.

This pack does not define TM Forum standards and does not replace IG1453.
It is a reference profile for deterministic governance behavior.

## Demonstrated Invariants

1. CIC (Canonical Meaning Precondition): required fields and canonical values.
2. PSC (Frozen Semantic State): bundle hash commitment checked at execution admission.

Overlay deny-wins composition is intentionally not included in this first reference slice.
