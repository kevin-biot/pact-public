# dssc-rulebook-policy-mapping-demo-pack

This is a DSSC-aligned demo ontology pack for `dssc-rulebook-policy-mapping` under Stage-4 pack authoring.

## Purpose

Demonstrate deterministic mapping of DSSC-style rulebook and ODRL policy expressions into PACT fail-closed decision semantics.

## Source Grounding

Canonical source references used for this pack draft are listed in `source-extract/sources.json`.

Primary references:
- https://blueprint.dssc.eu/
- https://www.w3.org/TR/odrl-model/
- https://www.w3.org/TR/odrl-vocab/
- https://eclipse-dataspace-protocol-base.github.io/DataspaceProtocol/HEAD/

## Intent Surface

- `dssc.policy.evaluate_access.v1`: Evaluate access request against mapped rulebook/ODRL policy snapshot.
- `dssc.policy.evaluate_usage.v1`: Evaluate post-access usage obligations and prohibitions.
- `dssc.policy.resolve_conflict.v1`: Deterministically resolve policy conflicts with deny-wins precedence.

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
- `source-extract/crosswalk/odrl-to-pact-policy-crosswalk.v1.json`

## Notes

- This pack is a non-normative demo surface for conformance and governance experimentation.
- Fixture harness wiring is planned in Stage-5.
