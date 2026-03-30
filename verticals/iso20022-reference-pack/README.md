# ISO 20022 Payments Reference Pack

## REVIEW CANDIDATE ARTIFACT

This pack is a review-candidate publication of an ISO 20022-focused payments ontology pack for external technical review.

## Scope

This pack includes:

1. ISO 20022 message-family concepts and message-type mappings.
2. Deterministic intent mappings for core payment flows.
3. Pattern hints, convergence fixtures, and a decision-space contract.
4. Signed bundle and OBT for integrity verification.

This pack does not include:

1. Runtime orchestration implementation.
2. Private tooling or internal deployment code.
3. Private signing seed material.

## Included Review Artifacts

1. `pack.json`, `bundle.json`, `obt.jws`
2. `vocab.skos.jsonld`, `context.jsonld`, `shapes.ttl`
3. `thesaurus.jsonld`, `thesaurus-local.json` (73 concepts, 190 synonyms)
4. `patterns.json`, `intent-mappings.json`, `convergence.json`, `decision-space.json`
5. `keys/ed25519-iso20022-pub.jwk.json`

## Conformance Notes

This pack is intended for artifact-level review and interoperability feedback against the public PACT schema surface.

Source lineage for this publication is captured in:

1. `lineage.json`
