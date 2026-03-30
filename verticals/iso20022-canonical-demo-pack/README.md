# ISO 20022 Canonical-Derived Narrow Demo Pack

This is a complete narrow sample pack extracted from the canonical ISO 20022 model,
focused only on:

1. `pacs.008.001.13`

## Why this pack exists

1. Demonstrate a full pack artifact set from canonical extraction in a single-message scope.
2. Provide a reviewer-friendly "minimum complete pack" with explicit runtime boundaries.
3. Keep the model deterministic and small for discussion/workshops.

## Included artifacts

1. `pack.json`, `bundle.json`, `obt.jws`
2. `context.jsonld`, `vocab.skos.jsonld`
3. `thesaurus.jsonld`, `thesaurus-local.json`
4. `intent-mappings.json`, `patterns.json`
5. `shapes.ttl`
6. `convergence.json`
7. `decision-space.json`
8. `extraction-summary.json`, `message-identifiers.json`

## Scope boundary

1. Accepted canonical message type: `pacs.008`
2. Accepted canonical message identifier: `pacs.008.001.13`
3. Out-of-scope behavior: `escalate`

## Relationship to other ISO demo pack

1. `registry/iso20022-authored-demo` is hand-curated and broader (Route A).
2. `registry/iso20022-canonical-demo` is extractive, narrow, and canonical-aligned (Route B).
