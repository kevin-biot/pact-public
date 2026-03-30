# ISO 20022 Canonical Extraction Contract

## Scope

This contract defines what to extract from the full ISO 20022 canonical
e-Repository model for a narrow sample pack centered on:

1. `pacs.008.001.13`

It is intentionally extractive and deterministic: no inferred ontology content
outside canonical source fields.

## Source Inputs

1. ISO 20022 e-Repository archive (`*.iso20022` XMI model)
2. ISO 20022 metamodel archive (`*.ecore`)

## Required Selection Decisions

1. Business area allowlist: `pacs`
2. Registration status allowlist: `Registered`
3. Message identifier allowlist: `pacs.008.001.13`
4. Version policy for this profile: exact identifier match
5. Out-of-scope behavior: `escalate`

## Required Canonical Extractions

For the selected message and its transitive closure:

1. Message identity
   1. full identifier (`pacs.008.001.13`)
   2. message type (`pacs.008`)
   3. area/functionality/flavour/version fields
   4. registration status

2. Message definition metadata
   1. canonical name
   2. definition text
   3. business process references where available

3. Structural model
   1. root message component
   2. all referenced message components (transitive)
   3. associations and attributes
   4. cardinality (`minOccurs`, `maxOccurs`)

4. Datatypes and constraints
   1. identifier/text/amount/date/time datatype references
   2. datatype restrictions (length, pattern, numeric bounds)
   3. currency and amount primitives where used

5. Code sets
   1. referenced code sets and code values
   2. deprecation/replacement metadata where available

6. Canonical synonyms and labels
   1. canonical labels and aliases from message/type names
   2. controlled local synonyms only when mapped to canonical IDs

## Projection into Pack Artifacts

1. `message-identifiers.json`
   1. selected identifier list
   2. selected message type list

2. `extraction-summary.json`
   1. source archive references
   2. selection policy used
   3. raw vs selected counts

3. `vocab.skos.jsonld`
   1. canonical concept for `iso20022:msgtype/pacs.008`
   2. labels/definitions from canonical model

4. `thesaurus.jsonld` and `thesaurus-local.json`
   1. canonical terms and approved synonyms for `pacs.008`
   2. no free-text terms without canonical anchor

5. `intent-mappings.json`
   1. canonical message type to intent mapping
   2. confidence and provenance fields if available

6. `patterns.json`
   1. deterministic match patterns for `pacs.008`
   2. no ambiguous wildcard patterns in narrow profile

7. `shapes.ttl`
   1. field presence/cardinality constraints from canonical structure
   2. datatype constraints from canonical datatypes
   3. code constraints from canonical code sets

8. `convergence.json`
   1. stability fixtures proving equivalent phrasing routes to same intent

9. `decision-space.json`
   1. admissible intent classes for this scope
   2. allowed transitions and escalation predicates
   3. required fact types tied to canonical message profile

## Non-Goals for This Profile

1. Full-network ISO 20022 coverage
2. Cross-standard semantic bridging (for example FIX/ISO 8583)
3. Non-canonical inferred classes not linked to source model

## Acceptance Checks

1. Selected identifier count is exactly 1 and equals `pacs.008.001.13`
2. Selected message type count is exactly 1 and equals `pacs.008`
3. Every emitted constraint in `shapes.ttl` traces to extracted canonical fields
4. `decision-space.json` routes unknown/unsupported messages to `escalate`
5. Pack schema and OBT verification tests pass
