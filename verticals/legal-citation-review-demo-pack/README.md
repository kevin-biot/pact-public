# Legal Citation Review Demo Pack

Non-normative public demo pack for accelerating legal drafting review with deterministic citation checks.

## Goal

Help legal teams review draft language faster by generating a structured review pack that aligns draft claims with source law references.

This pack is designed to support human reviewers, not replace legal judgment.

## What It Checks

1. Every draft claim has at least one citation.
2. Cited sources exist in the source corpus for the review.
3. Cited sources actually support the claim identifier being asserted.
4. Jurisdiction alignment holds between claim scope and cited sources.
5. Effective-date window of the cited source covers the review date.

## Output Behavior

1. Claims that pass checks are marked review-ready.
2. Failing claims return deterministic reason codes.
3. The system can fail-closed (`deny/escalate`) while still producing a machine-reviewable pack for human adjudication.

## Why This Helps Legal Teams

1. Speeds first-pass citation alignment for new drafts.
2. Surfaces unsupported or stale claims before publication.
3. Reduces manual scanning load by focusing reviewer time on flagged mismatches.
4. Produces traceable review artifacts that can feed governance and audit workflows.

## Status

1. Public candidate demo pack for interoperability and governance review.
2. Synthetic examples only; not legal advice and not jurisdiction-authoritative.
