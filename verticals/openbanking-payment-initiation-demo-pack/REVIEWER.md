# Reviewer Notes: Open Banking Payment Initiation Demo

## Purpose

This pack is a narrow, closed-world demo for payment initiation operations:

1. payment initiate
2. payment status read
3. payment cancel

## Why this exists

1. provide deterministic payment operation intent routing,
2. keep model operationally small for deployer tests,
3. evidence source alignment to public open banking standards.

## Key artifacts

1. `vocab.skos.jsonld`: canonical payment concepts.
2. `thesaurus-local.json`: curated synonym layer.
3. `patterns.json`: deterministic lexical/shape matchers.
4. `intent-mappings.json`: canonical intent mapping table.
5. `decision-space.json`: admissible decision states + escalation.
6. `convergence.json`: perturbation stability fixtures.
7. `shapes.ttl`: required structural constraints.
8. `source-extract/sources.json`: upstream URL/hash evidence and replay commands.

## Review checklist

1. payment intents are mutually distinct,
2. unknown operations escalate,
3. patterns map consistently to intent space,
4. source hashes and references remain reproducible.
