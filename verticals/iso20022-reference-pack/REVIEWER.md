# ISO 20022 Reference Pack Reviewer Guide

## Purpose

This public reference pack is published for external technical review.
It demonstrates the pack artifact contract using an ISO 20022 payments slice.

This is a review candidate, not a full production standards implementation.

## Why This Exists

1. Make the ontology-pack model inspectable without private runtime code.
2. Provide a signed, hash-bound artifact set for interoperability review.
3. Show deterministic semantic mapping and bounded decision authority.
4. Give standards groups a concrete baseline to critique and improve.

## Trust and Verification Flow

1. Read `pack.json` for the normative file contract.
2. Validate `bundle.json` hashes for every declared file.
3. Verify `obt.jws` signature using `keys/ed25519-iso20022-pub.jwk.json`.
4. Only then evaluate vocabulary, mappings, shapes, and decision space.

## Artifact Definitions

1. `pack.json`
Definition: top-level descriptor (identity, trust tier, validity, file bindings).
Why: defines the exact artifact set and governance envelope.

2. `bundle.json`
Definition: SHA-256 hash manifest for all pack files.
Why: enables tamper detection and deterministic bundle identity.

3. `obt.jws`
Definition: signed bundle token.
Why: binds publisher identity to the exact manifest payload.

4. `keys/ed25519-iso20022-pub.jwk.json`
Definition: public verification key for `obt.jws`.
Why: allows third parties to verify signatures without private key access.

5. `context.jsonld`
Definition: JSON-LD context for term and namespace resolution.
Why: keeps semantics unambiguous across implementations.

6. `vocab.skos.jsonld`
Definition: canonical SKOS concept set for this ISO 20022 slice.
Why: provides concept IDs used by mappings and constraints.

7. `thesaurus.jsonld`
Definition: normalized synonym artifact for pack consumers.
Why: supports deterministic lexical normalization.

8. `thesaurus-local.json`
Definition: reviewer-facing local thesaurus source.
Why: transparent lexical coverage baseline (73 concepts, 190 synonyms).

9. `shapes.ttl`
Definition: SHACL structural constraints for supported message types.
Why: enforces structural admissibility before decision processing.

10. `patterns.json`
Definition: pattern cues mapped to concept URIs.
Why: deterministic entity and intent hint extraction.

11. `intent-mappings.json`
Definition: concept URI to intent-class map with confidence floors.
Why: predictable semantic-to-intent routing.

12. `convergence.json`
Definition: fixed phrase fixtures and pass thresholds.
Why: stable regression signal across pack revisions.

13. `decision-space.json`
Definition: allowed intents, facts, transitions, and escalation policy.
Why: explicit authority boundary and auditable decision contract.

14. `lineage.json`
Definition: publication lineage metadata for this reference artifact.
Why: review transparency about origin, scope, and exclusions.

## Reviewer Checklist

1. Confirm `pack.json` file entries are present in directory.
2. Confirm `bundle.json` hashes match current file bytes.
3. Verify `obt.jws` using the published Ed25519 JWK.
4. Cross-check concept URIs in mappings and patterns against vocabulary IDs.
5. Cross-check decision-space intent classes against intent mappings.

## Scope Statement

This profile currently focuses on core payment message flows:

1. `pacs.008`, `pacs.002`, `pain.001`, `camt.053`, `pain.008`, `pacs.004`.

It is intentionally compact to support fast standards-level review.
