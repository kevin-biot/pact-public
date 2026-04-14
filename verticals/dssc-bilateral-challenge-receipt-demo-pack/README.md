# dssc-bilateral-challenge-receipt-demo-pack

This is a DSSC-aligned demo ontology pack for `dssc-bilateral-challenge-receipt` under Stage-4 pack authoring.

## Purpose

Demonstrate cross-jurisdiction challenge/receipt governance with dual policy snapshots and correlated evidence anchors.

## Source Grounding

Canonical source references used for this pack draft are listed in `source-extract/sources.json`.

Primary references:
- https://blueprint.dssc.eu/
- https://eclipse-dataspace-protocol-base.github.io/DataspaceProtocol/HEAD/

## Intent Surface

- `dssc.governance.submit_challenge.v1`: Submit cross-jurisdiction challenge payload with origin snapshot.
- `dssc.governance.issue_receipt.v1`: Issue correlated receipt with target-side policy snapshot.

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
node tools/run-dssc-bilateral-challenge-receipt-fixtures.mjs
```

## Two-Pass Authoring (V1/V2)

- `V1 mechanical`: canonical authored baseline for deterministic runtime and fixture behavior.
- `V2 GLiNER candidate`: fast extraction pass for candidate entities/relations only.
- `Review gate`: no V2 candidate is promoted without explicit human review.

Candidate artifacts are stored under `source-extract/candidates/gliner-dirty-pass-2026-04-14/`.

Current GLiNER Docker candidate pass: `dssc-bilateral-challenge-receipt-gliner-docker-pass-2026-04-14` (image: `gliner-extractor:latest`).
