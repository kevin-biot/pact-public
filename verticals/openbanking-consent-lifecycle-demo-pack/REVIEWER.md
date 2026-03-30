# Reviewer Notes: Open Banking Consent Lifecycle Demo

## Purpose

This pack is a narrow, closed-world demo for consent trajectory handling:

1. consent create
2. consent authorize
3. consent revoke
4. consent status read

## Why this exists

1. represent consent state transitions as explicit machine-decision space,
2. avoid open-ended interpretation at runtime,
3. bind ontology artifacts to upstream standards references.

## Key artifacts

1. `vocab.skos.jsonld`: canonical consent lifecycle concepts.
2. `thesaurus-local.json`: approved local language variants.
3. `patterns.json`: deterministic operation matching rules.
4. `intent-mappings.json`: normalized intent contract.
5. `decision-space.json`: allowed transitions and escalation.
6. `convergence.json`: stability fixtures across text perturbations.
7. `shapes.ttl`: payload constraint model.
8. `source-extract/sources.json`: upstream provenance lock (URL + hash + replay).

## Review checklist

1. lifecycle transitions are explicit and finite,
2. unsupported operations route to escalate,
3. convergence fixtures enforce stable intent under rephrasing,
4. source-extract references are reproducible.
