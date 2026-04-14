# dssc-eudi-attestation-admission-demo-pack

This is a DSSC-aligned demo ontology pack for `dssc-eudi-attestation-admission` under Stage-4 pack authoring.

## Purpose

Demonstrate deterministic identity and attestation admission mapping from OpenID4VP/VC claims into corridor authorization outcomes.

## Source Grounding

Canonical source references used for this pack draft are listed in `source-extract/sources.json`.

Primary references:
- https://openid.net/specs/openid-4-verifiable-presentations-1_0.html
- https://www.w3.org/TR/vc-data-model-2.0/
- https://eur-lex.europa.eu/legal-content/EN/ALL/?uri=CELEX%3A32024R1183
- https://projects.eclipse.org/projects/technology.dataspace-dcp
- https://blueprint.dssc.eu/

## Intent Surface

- `dssc.identity.evaluate_attestation.v1`: Evaluate attestation and corridor admission eligibility.
- `dssc.identity.verify_trust_anchor.v1`: Verify credential issuer trust anchor and revocation status.

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
- `source-extract/crosswalk/openid4vp-vc-to-corridor-crosswalk.v1.json`

## Notes

- This pack is a non-normative demo surface for conformance and governance experimentation.
- Fixture harness wiring is planned in Stage-5.

## Fixture Harness

Run from repository root:

```bash
node tools/run-dssc-eudi-attestation-admission-fixtures.mjs
```

## Two-Pass Authoring (V1/V2)

- `V1 mechanical`: canonical authored baseline for deterministic runtime and fixture behavior.
- `V2 GLiNER candidate`: fast extraction pass for candidate entities/relations only.
- `Review gate`: no V2 candidate is promoted without explicit human review.

Candidate artifacts are stored under `source-extract/candidates/gliner-dirty-pass-2026-04-14/`.

Current GLiNER Docker candidate pass: `dssc-eudi-attestation-admission-gliner-docker-pass-2026-04-14` (image: `gliner-extractor:latest`).
