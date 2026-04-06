# Economic Measurement Drift Demo Pack

This is a non-normative synthetic demo pack showing how PACT-style ontology governance can detect semantic drift in macroeconomic measurement terms across standards cycles.

The pack is grounded to public source material (SNA and ICP documents), but it is intentionally a demo surface rather than a normative economic methodology standard.

## Why This Pack Exists

A policy can reference a term like `GDP at PPP` at one point in time, while the underlying standards and methods evolve later.

If agents replay policy logic against newer measurements without checking semantic drift, decisions can become inconsistent with the original policy intent.

This pack demonstrates a bounded way to detect that risk and escalate for review.

## Core Demonstration

The pack models three stability vectors:

1. `V1` definition structural drift.
2. `V2` classification drift.
3. `V3` coverage/methodology drift.

It then binds those vectors to intent classes and decision-space constraints so drift-aware behavior is deterministic and auditable.

## How This Helps in Practice

This pack is useful when teams must make decisions today using terms authored in older policy or contract text.

1. Treaty and contract thresholds:
It reduces the risk of silently applying new measurement semantics to old threshold clauses.
2. Regulatory and policy replay:
It gives reviewers a structured way to test whether a historical decision remains semantically valid under current standards.
3. Agentic workflow safety:
It prevents downstream agents from consuming a drifted fact as if it were unchanged, by forcing explicit review/escalation paths.
4. Audit and evidence quality:
It records version anchors, crosswalk lineage, and drift scores so reviewers can inspect the why, not only the outcome.

## Who Benefits

1. Policy and legal teams:
Clear signal when semantic drift may invalidate literal threshold interpretation.
2. Data and economics teams:
A repeatable method to document comparability risk between cycles.
3. Agent platform teams:
A bounded decision surface that is deterministic, testable, and compatible with conformance fixtures.
4. Governance and assurance functions:
Traceable provenance from source document to crosswalk to decision recommendation.

## Pipeline Fit (Authoring to Runtime)

1. Source extraction captures standards references and candidate terms.
2. Crosswalk and drift relations encode continuity and change points.
3. Pack artifacts bind those relations to intents, shapes, and decision constraints.
4. Runtime or promotion gates evaluate drift vectors and enforce pass/escalate behavior.
5. Evidence artifacts preserve decision context for replay and audit.

## Synthetic Scenario Used

1. Baseline policy era (example): `SNA2008 + ICP2017`.
2. Current measurement era (example): `SNA2025 + ICP2021`.
3. Trigger concept: `GDP at PPP`.
4. Governance question: does the current measured quantity still mean the same thing as when policy thresholds were authored?

The output is a bounded recommendation surface (pass/escalate/review), not autonomous policy rewriting.

## Artifact Layout

- `pack.json`: pack descriptor and logical file map.
- `bundle.json`: content digest manifest for all mapped artifacts.
- `obt.jws`: signed binding token for runtime verification demo.
- `vocab.skos.jsonld`: core concept vocabulary.
- `shapes.ttl`: SHACL guardrails for required decision fields.
- `intent-mappings.json`: deterministic concept-to-intent bindings.
- `decision-space.json`: bounded execution/state model and required fields.
- `convergence.json`: classifier convergence fixtures.
- `source-extract/sources.json`: source URLs, access times, hashes.
- `source-extract/crosswalk/*.json`: provisional standards crosswalks.
- `ontology/*.ttl`: synthetic SNA/ICP concept schemes and drift relations.
- `rubrics/*/rubric.yaml`: scoring rubric definitions.
- `stability/targets/*.yaml`: target thresholds and actions.
- `source-extract/candidates/gliner-dirty-pass-2026-04-06/*`: candidate-only extraction pass.
- `source-extract/tasks/immutable-execution-checklist.v1.json`: task progression ledger.

## Source Grounding

The pack uses captured public references under:

- `source-extract/groundtruth/2026-04-06/`

Primary sources include:

1. UN Statistics Division SNA 2008 PDF.
2. UN Statistics Division SNA 2025 overview + pre-edit PDF.
3. World Bank ICP reports index.
4. World Bank ICP 2017 report and ICP 2021 methodology page.

See `source-extract/sources.json` for canonical URLs and digests.
Large PDF binaries are intentionally excluded from public git history; re-fetch from the recorded URLs when local inspection is needed.

## Candidate/Review Boundary

The GLiNER pass in this pack is a `candidate` acceleration artifact only.

Rules:

1. Candidate output is not authoritative.
2. Candidate entities do not become ontology assertions without human review.
3. Downstream promotion gates should reject unreviewed candidate assertions.

## Fixture Harness

Run the demo fixture harness from repo root:

```bash
node tools/run-economic-measurement-drift-fixtures.mjs
```

What it validates:

1. Bundle binding checks (`PSC_BUNDLE_COMMIT_MISMATCH`).
2. In-scope intent enforcement (`ESCALATE_OUT_OF_SCOPE_INTENT`).
3. Required field checks (`CIC_REQUIRED_FIELD_MISSING`).
4. Drift vector value bounds (`CIC_CANONICAL_VALUE_INVALID`).

## Limits

1. This pack does not publish official SNA/ICP normative semantics.
2. Quantitative drift scores are synthetic for demonstration.
3. Direct download of one referenced ICP 2011 PDF link may vary by environment; the reports index capture is preserved for lineage evidence.

## Intended Use

Use this pack as a public demonstration of domain portability and governance behavior:

1. Bounded intent surface.
2. Version-aware concept lineage.
3. Drift-triggered human review path.
4. Deterministic replay checks with fixture evidence.
