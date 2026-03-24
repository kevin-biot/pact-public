# Agentic Error Flow and Domain Ontology Composition

## Purpose

Define how RFC 9457 problem detail responses flow through the agentic call chain when both caller and target operate within ontology-governed domain spaces. This document assumes ontology usage as standard agent hygiene — the baseline for production-grade agentic systems, not an optional enhancement.

## The Problem with Flat Error Responses

A single-provider error response (e.g., a CDN returning `retryable: true, retry_after: 30`) works when one authority controls the entire error surface. But agentic workflows cross domain boundaries:

1. An agent governed by one domain ontology calls an API governed by another.
2. Intermediaries (gateways, proxies, mesh sidecars) may inject their own error responses.
3. The agent must compose error semantics from multiple sources to make a single decision.

Flat RFC 9457 extensions (boolean flags, string categories) do not compose. Two `retryable: true` responses from different providers may have contradictory semantics. Without a shared ontology layer, the agent is left guessing.

## The Agentic Error Flow

```
  Calling Domain                  Shared Domain Space                Target Domain
 ┌─────────────┐               ┌───────────────────┐              ┌──────────────┐
 │  Caller      │               │                   │              │  Target API  │
 │  Ontology    │               │  PACT Contract    │              │  Ontology    │
 │              │               │  Surface          │              │              │
 │  - intents   │   request     │  - pack schemas   │   request    │  - intents   │
 │  - facts     ├──────────────►│  - error taxonomy ├─────────────►│  - facts     │
 │  - deontic   │               │  - deontic model  │              │  - deontic   │
 │  - risk      │               │  - RFC 9457       │              │  - risk      │
 │    bands     │  RFC 9457     │    profile        │  RFC 9457    │    bands     │
 │              │◄──────────────┤                   │◄─────────────┤              │
 │              │  (composed)   │  - overlay        │  (origin)    │              │
 │              │               │    composition    │              │              │
 └─────────────┘               └───────────────────┘              └──────────────┘
      Agent                        Governance                        Service
```

### 1. Caller Ontology (Agent Domain Space)

The calling agent operates within its own domain ontology:

- **Admissible intents**: what the agent is permitted to request.
- **Admissible facts**: what data shapes the agent can send.
- **Deontic constraints**: what the agent `must`, `may`, or `must_not` do.
- **Risk posture**: the agent's own risk band and tolerance.

Before making an outbound call, a well-governed agent validates that the request is within its own decision-space contract. An agent that does not govern its own outbound requests cannot meaningfully interpret error responses from others.

### 2. Shared Domain Space (PACT Contract Surface)

The shared domain space is where caller and target agree on semantics. This is the PACT contract surface:

- **Error taxonomy**: both sides use the same stable error codes (`DSC_*`, `OVL_*`, `ATTN_*`, etc.) from the PACT problem extension schema.
- **Deontic model**: `must`, `may`, `must_not` have the same meaning for both parties.
- **RFC 9457 profile**: the wire format contract (`pact_error_code`, `pact_deontic`, `pact_domain`, etc.) is the shared projection.
- **Overlay composition**: when caller and target operate under different jurisdictional overlays, the shared space defines composition rules (deny-wins precedence).

The shared domain space does not require both sides to use the same internal ontology. It requires both sides to project their domain semantics through the same contract surface.

### 3. Target API (Service Domain Space)

The target API operates within its own domain ontology:

- **Decision-space contract**: what intents, facts, and transitions the API admits.
- **Policy gate**: the API evaluates the request against its committed policy snapshot.
- **Error generation**: when the request is denied, the API produces an RFC 9457 response with PACT extension members projected from its own ontology.

The target's error response carries enough semantic context for the caller to act without knowing the target's internal ontology structure.

### 4. Composed Error Response (Return Path)

The return path is where flat error fields break down and ontology composition becomes essential.

**Single-hop case** (agent calls one API):

The agent receives one RFC 9457 response. It matches `pact_error_code` against its own decision-space contract to determine the correct action:

- `pact_deontic: must_not` — hard stop, do not retry, record evidence.
- `pact_deontic: must` — obligation unfulfilled, escalate.
- `pact_deontic: may` with `retryable` context — retry with backoff.

**Multi-hop case** (agent calls API A, which calls API B):

The agent may receive an error that originated at API B, passed through API A, and possibly through intermediaries. Each hop may add or transform error context:

- API B returns `DSC_TRANSITION_NOT_ADMISSIBLE` with `pact_deontic: must_not`.
- API A wraps this in its own error response, potentially with a different `pact_domain`.
- The agent must compose both: the inner `must_not` takes precedence (deny-wins).

This composition is deterministic only if both APIs project through the same contract surface with the same deontic model and the same composition rules.

**Intermediary case** (CDN, gateway, or proxy injects an error):

An intermediary returns a non-PACT RFC 9457 response (e.g., flat `retryable: true`). The agent must distinguish:

- PACT-governed responses (contain `pact_error_code` and `pact_schema_version`).
- Non-PACT responses (flat RFC 9457 with provider-specific extensions).

For non-PACT responses, the agent falls back to its own ontology's out-of-scope behavior (typically: escalate or deny). See `docs/architecture/security-unsigned-error-instruction-injection.md` for the full threat model and agent hygiene rules for handling untrusted error responses.

## Why Ontology Is Agent Hygiene

Ontology-governed error handling is not a premium feature. It is baseline hygiene for production agents, for the same reasons that TLS, authentication, and input validation are hygiene:

1. **Without caller ontology**: the agent cannot validate its own outbound requests. It sends requests it should not, receives errors it cannot interpret, and retries when it should stop.

2. **Without shared ontology**: two PACT-compliant APIs using different `pact_deontic` interpretations produce contradictory guidance. The agent has no composition rule and falls back to heuristics.

3. **Without target ontology**: the API returns flat error fields. The agent can parse them but cannot determine whether "retry in 30s" means "transient infrastructure issue" or "your request violated a regulatory constraint and will never succeed."

4. **Without composition rules**: multi-hop errors lose semantic context at each boundary. By the time the error reaches the agent, the original deontic classification is gone.

The minimum viable ontology for an agent is:

- A decision-space contract declaring what the agent may request.
- A mapping from PACT error codes to local actions (retry, escalate, stop).
- Deny-wins composition for multi-source error responses.
- Evidence emission for audit trail.

## Relationship to Existing Flat RFC 9457 Implementations

Flat RFC 9457 implementations (provider-specific `error_category` enums, `retryable` booleans, prose `what_you_should_do` fields) are useful within a single-provider domain. They solve the "HTML error page" problem.

PACT does not replace these implementations. It provides the composition layer:

| Concern | Flat RFC 9457 | PACT RFC 9457 profile |
|---------|--------------|----------------------|
| Single-provider errors | Sufficient | Sufficient |
| Cross-provider composition | No mechanism | Overlay composition with deny-wins |
| Semantic versioning | By promise | By schema version + pack version |
| Deontic classification | Prose guidance | Machine-checkable `must`/`may`/`must_not` |
| Regulatory traceability | None | `pact_source_ref` with regulatory citation |
| Trust model | Implicit (provider reputation) | Explicit (trust tiers, signed packs) — see [security consideration](security-unsigned-error-instruction-injection.md) |
| Evidence | Trace ID | Immutable audit chain |

Single-service RFC 9457 implementations (e.g., exception-to-status-code middleware that maps application errors to Problem Details responses) solve the format problem within one service boundary. Each service defines its own exception taxonomy, its own `type` URIs, and its own retry semantics. Two services, both fully RFC 9457 compliant, produce semantically incompatible error responses — different `type` URIs for equivalent failures, different retry conventions, different error classification schemes. An agent consuming both services must maintain per-service error handling logic, which is exactly the fragmentation RFC 9457 was supposed to eliminate. PACT's shared error taxonomy, deontic model, and schema-validated extension fields exist to close this gap: one contract surface that means the same thing regardless of which service produced the error.

An agent operating in regulated domains SHOULD use the PACT profile. An agent operating in unregulated, single-provider contexts MAY use flat RFC 9457 extensions directly.

## Conformance Expectation

Agents and APIs claiming PACT conformance for RFC 9457 error handling MUST:

1. Include `pact_error_code`, `pact_domain`, and `pact_schema_version` in all problem responses.
2. Use only error codes listed in `schemas/pact-problem-extensions.schema.json`.
3. Apply deny-wins composition when multiple error sources contribute to a single response.
4. Treat non-PACT RFC 9457 responses as out-of-scope (escalate or deny per local policy).
5. Emit evidence for all deny decisions that carry deontic `must` or `must_not` classifications.

## Related Artifacts

- `docs/rfc9457-pact-profile.md` — RFC 9457 PACT profile specification
- `schemas/pact-problem-extensions.schema.json` — PACT problem extension schema
- `docs/architecture/real-world-deployment-overview.md` — PACT operational flow
- `docs/architecture/pack-bounded-authority.md` — authority boundary for external context
- `docs/architecture/security-unsigned-error-instruction-injection.md` — threat model for unsigned error instruction injection
- `docs/adr/ADR-003-extension-model-and-reference-vertical-packs.md` — extension model
