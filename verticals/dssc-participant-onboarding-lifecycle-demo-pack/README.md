# dssc-participant-onboarding-lifecycle-demo-pack

This is a DSSC-aligned demo ontology pack for `dssc-participant-onboarding-lifecycle` under Stage-4 pack authoring.

## Purpose

Demonstrate deterministic participant lifecycle governance states for DSSC-aligned admission and trust operations.

## Source Grounding

Canonical source references used for this pack draft are listed in `source-extract/sources.json`.

Primary references:
- https://blueprint.dssc.eu/

## Intent Surface

- `dssc.participant.transition_state.v1`: Apply participant lifecycle transition with deterministic guards.
- `dssc.participant.evaluate_admission.v1`: Evaluate admission readiness from trust and policy inputs.

## Determinism Boundary

- Out-of-scope behavior is `escalate`.
- Policy/bundle binding is required for admitted execution paths.
- Deny reason codes are explicit and stable for fixture replay.

## Included Artifacts

- `README.md`
- `pack.json`
- `context.jsonld`
- `vocab.skos.jsonld`
- `shapes.ttl`
- `thesaurus.jsonld`
- `thesaurus-local.json`
- `patterns.json`
- `intent-mappings.json`
- `convergence.json`
- `decision-space.json`
- `message-identifiers.json`
- `extraction-summary.json`
- `bundle.json`
- `obt.jws`
- `source-extract/sources.json`

## Notes

- This pack is a non-normative demo surface for conformance and governance experimentation.
- Fixture harness wiring is planned in Stage-5.

## Fixture Harness

Run from repository root:

```bash
node tools/run-dssc-participant-onboarding-lifecycle-fixtures.mjs
```
