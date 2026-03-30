# Reviewer Notes: Open Banking AIS Read Demo

## Purpose

This pack is a narrow, closed-world demo for account information access (AIS):

1. account reads
2. balance reads
3. transaction reads

## Why this exists

1. show deterministic intent routing for AIS operations,
2. keep runtime scope constrained for agent execution,
3. provide explicit source extraction evidence from upstream standards.

## Key artifacts

1. `vocab.skos.jsonld`: core AIS concepts used by runtime classification.
2. `thesaurus-local.json`: curated synonyms anchored to canonical concept IDs.
3. `patterns.json`: deterministic lexical/pattern triggers.
4. `intent-mappings.json`: concept-to-intent mapping contract.
5. `decision-space.json`: admissible intents and escalation rules.
6. `convergence.json`: perturbation stability fixtures.
7. `shapes.ttl`: structural constraints for request payload validation.
8. `source-extract/sources.json`: upstream source URLs, hashes, and replay commands.

## Review checklist

1. unknown AIS operations escalate,
2. equivalent phrasing converges to same intent,
3. every non-canonical synonym has canonical anchor,
4. source hashes resolve to current referenced upstream artifacts.
