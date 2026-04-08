# Benefit Allocation Risk Evolution Pattern

This document defines a reusable pattern for ontology-driven concept evolution where runtime decisions must bind to the active concept version at request time.

It is implemented in:

1. `verticals/benefit-allocation-risk-evolution-demo-pack/`
2. `fixtures/benefit-allocation-risk-evolution/`
3. `tools/run-benefit-allocation-risk-evolution-fixtures.mjs`

## Problem

Policy concepts evolve. If runtime services continue to execute with stale concept semantics, replay and audit guarantees degrade.

The required control is not "latest is best." The required control is "decision used the version that was active when the decision was made."

## Invariants

A decision may execute only if all checks pass:

1. Bundle binding is valid for the loaded pack.
2. Governance gate is satisfied.
3. Control validation proof exists.
4. Decision binds to the active concept version for `request_time`.
5. Requested action is permitted for that active version.
6. Decision outcome is justified by active threshold semantics.
7. Evidence hashes are present and canonical (`sha256:<64-hex>`).

Failures are deterministic and fail closed.

## Retrieval Contract (Version-Aware)

Runtime retrieval should support explicit version requests, not only "latest."

Recommended request fields:

1. `pack_id`
2. `domain`
3. `version` (optional explicit semantic version)
4. `as_of` (optional timestamp for active-version resolution)
5. `prefer_latest` (default `false` in regulated flows)

Resolution rules:

1. If `version` is provided, load that exact version or fail.
2. Else if `as_of` is provided, resolve the version active at `as_of`.
3. Else resolve using current time.
4. `prefer_latest=true` is advisory and must not bypass explicit `version`/`as_of`.

## Transition Strategy (Two Versions Side by Side)

To avoid breaking active decisions during concept upgrades:

1. Publish new version (`v1.1`) with `active_from`.
2. Keep prior version (`v1.0`) valid through `active_until`.
3. Accept both only during overlap windows.
4. Require decision events to bind explicit `concept_version`.
5. After cutover, deny stale version use with `DENY_VERSION_NOT_ACTIVE`.

This supports:

1. Deterministic replay of historical decisions.
2. Safe migration without ambiguous "latest" behavior.
3. Audit clarity for why a request passed yesterday and fails today.

## Enforcement Surface

The demo pack encodes enforcement in:

1. `concept-versions.json` for active windows and version-specific controls.
2. `decision-space.json` for allow/deny reason-code semantics.
3. `evidence-template.json` for minimum trace envelope.

The fixture harness validates these controls as executable contract tests.

## Relationship to Spatial Guardrails

This pattern is temporal/version governance. Spatial packs such as `verticals/telco-spatial-workorder-guard-demo-pack/` add geometric authorization boundaries.

Both patterns compose well:

1. Temporal/version constraints answer "which semantic contract is active?"
2. Spatial constraints answer "where is action authority valid?"

Combined, they provide bounded authority across time, meaning, and scope.

## Cost and Tradeoff

This control model is intentionally strict:

1. More metadata in requests and decision events.
2. More deterministic denies when callers omit version/time context.
3. Higher discipline in pack publication and lifecycle management.

The upside is replayable, inspectable, and enforceable governance behavior under change.
