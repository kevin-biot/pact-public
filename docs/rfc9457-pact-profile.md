# RFC 9457 PACT Problem Detail Profile

**Status:** Draft
**Date:** 2026-03-24
**Normative references:** RFC 9457 (IETF STD), pact-public ADR-003, ontology ADR-059
**Schema:** `schemas/pact-problem-extensions.schema.json`

---

## 1. Purpose

This profile defines how PACT-governed APIs produce RFC 9457 Problem Detail responses. It specifies:

1. Required and optional extension members (`pact_*` fields).
2. `type` URI structure for machine-stable error identification.
3. Which ontology domain concepts are projected into wire responses.
4. Conformance requirements for implementations.

---

## 2. Conformance

The key words "MUST", "MUST NOT", "SHOULD", "SHOULD NOT", and "MAY" are used as described in RFC 2119.

A conformant PACT API:

- MUST produce `application/problem+json` responses for all 4xx and 5xx status codes.
- MUST include the `type`, `title`, `status`, and `pact_error_code` fields.
- MUST NOT include ontology fields annotated `projection: internal` (per ontology ADR-059).
- MUST use the `type` URI structure defined in §3.
- SHOULD include `instance` as an opaque trace reference for audit correlation.

A conformant PACT client:

- MUST branch on `type` or `pact_error_code`, never on `title` or `detail` text.
- MUST ignore unknown extension members (per RFC 9457 §3).
- SHOULD use `instance` for support/audit escalation.

---

## 3. `type` URI Structure

```
https://pact.example/problems/{PACT_ERROR_CODE}
```

- `{PACT_ERROR_CODE}` is the stable machine code from the ontology error taxonomy (e.g., `DSC_INTENT_NOT_ADMISSIBLE`).
- The URI MUST resolve to human-readable documentation.
- The special value `about:blank` (RFC 9457 default) MUST NOT be used by conformant PACT APIs.

---

## 4. Extension Members

### 4.1 Required Extensions

| Field | Type | Description |
|-------|------|-------------|
| `pact_error_code` | string | Stable machine code from ontology error taxonomy. MUST match the `{PACT_ERROR_CODE}` segment of the `type` URI. |
| `pact_domain` | string | Pack domain identifier (e.g., `payments`, `telco-reference`). |
| `pact_schema_version` | string | Version of the PACT problem extension schema. Currently `"1.0"`. |

### 4.2 Optional Extensions

Included when the originating subsystem provides the context:

| Field | Type | When included |
|-------|------|---------------|
| `pact_deontic` | enum: `may`, `must`, `must_not` | When the error relates to a decision-space transition with deontic classification. |
| `pact_source_ref` | string | When the deontic classification cites a regulatory source (e.g., `psd3:article:97:1:a`). |
| `pact_decision_state` | string | When the error occurs within a decision-space state model. |

### 4.3 Conditional Extensions

Included only when the delivery profile explicitly enables them (default: omitted):

| Field | Type | Delivery profile gate |
|-------|------|----------------------|
| `pact_risk_band` | enum: `Low`, `Medium`, `High`, `Critical` | `rfc9457_projection.risk_band: true` |
| `pact_corridor_id` | string | `rfc9457_projection.corridor_id: true` |

---

## 5. HTTP Status Code Mapping

PACT error code prefixes map to HTTP status ranges:

| Prefix | Primary HTTP status | Rationale |
|--------|-------------------|-----------|
| `DSC_*` | 422 Unprocessable Content | Contract violation — syntactically valid but semantically inadmissible |
| `OVL_*` | 409 Conflict / 422 | Composition or precedence conflict |
| `TAX_*` | 409 Conflict / 422 | Taxonomy constraint violation |
| `ATTN_*` | 400 Bad Request / 403 Forbidden | Policy binding validation or denial |
| `RSE_*` | 422 Unprocessable Content | Risk signal envelope violation |
| `ROUTE_*` | 502 Bad Gateway / 503 Service Unavailable | Routing or federation failure (conditional codes only) |

Implementations MAY refine within these ranges. The `status` field in the problem response MUST match the actual HTTP status code.

---

## 6. Examples

### 6.1 Decision-Space Violation

```json
{
  "type": "https://pact.example/problems/DSC_INTENT_NOT_ADMISSIBLE",
  "title": "Intent not admissible in current decision space",
  "status": 422,
  "detail": "Intent class payments.transfer.initiate.v1 is not admissible in state 'suspended'.",
  "instance": "urn:trace:9f3d-abc1-7e2f",
  "pact_error_code": "DSC_INTENT_NOT_ADMISSIBLE",
  "pact_domain": "payments",
  "pact_schema_version": "1.0",
  "pact_decision_state": "suspended",
  "pact_deontic": "must_not",
  "pact_source_ref": "psd3:article:97:1:a"
}
```

### 6.2 Overlay Conflict

```json
{
  "type": "https://pact.example/problems/OVL_PRECEDENCE_CONFLICT",
  "title": "Overlay precedence conflict",
  "status": 409,
  "detail": "Overlays for jurisdictions EU and UK produce conflicting precedence on deny-wins evaluation.",
  "instance": "urn:trace:a1b2-c3d4-e5f6",
  "pact_error_code": "OVL_PRECEDENCE_CONFLICT",
  "pact_domain": "payments",
  "pact_schema_version": "1.0"
}
```

### 6.3 Policy Binding Denial

```json
{
  "type": "https://pact.example/problems/ATTN_POLICY_INTENT_CLASS_DENIED",
  "title": "Intent class denied by policy",
  "status": 403,
  "detail": "Intent class lending.approve.v1 denied under current policy binding.",
  "instance": "urn:trace:f7g8-h9i0-j1k2",
  "pact_error_code": "ATTN_POLICY_INTENT_CLASS_DENIED",
  "pact_domain": "lending",
  "pact_schema_version": "1.0"
}
```

### 6.4 With Conditional Risk Band (delivery profile enabled)

```json
{
  "type": "https://pact.example/problems/DSC_TRANSITION_NOT_ADMISSIBLE",
  "title": "State transition not admissible",
  "status": 422,
  "detail": "Transition from 'active' to 'execute' requires risk band Low or Medium.",
  "instance": "urn:trace:m3n4-o5p6-q7r8",
  "pact_error_code": "DSC_TRANSITION_NOT_ADMISSIBLE",
  "pact_domain": "payments",
  "pact_schema_version": "1.0",
  "pact_decision_state": "active",
  "pact_deontic": "must",
  "pact_risk_band": "High",
  "pact_corridor_id": "payments-eu-uk"
}
```

---

## 7. Versioning

- The `pact_schema_version` field tracks this profile's version.
- Minor version increments (1.0 → 1.1) add optional fields only (backward-compatible).
- Major version increments (1.x → 2.0) may change required fields or remove fields.
- The profile version is independent of ontology schema versions but MUST document which ontology version it projects from.

---

## 8. Conformance Fixtures

Conformance fixtures are provided in `fixtures/rfc9457/`:

| Fixture | Description |
|---------|-------------|
| `valid-problem-dsc-001.json` | Valid DSC problem with all required + optional fields |
| `valid-problem-ovl-001.json` | Valid OVL problem with required fields only |
| `valid-problem-attn-001.json` | Valid ATTN denial problem |
| `valid-problem-conditional-001.json` | Valid problem with conditional fields enabled |
| `fail-missing-error-code.json` | Missing `pact_error_code` — MUST fail validation |
| `fail-internal-code-leaked.json` | Contains `projection: internal` code — MUST fail validation |
| `fail-conditional-without-profile.json` | Contains conditional field without delivery profile gate — MUST fail validation |

---

## 9. Relationship to Ontology

This profile is a **projection** of ontology error semantics, not a redefinition.

- Error code semantics are authoritative in the ontology repo.
- This profile selects which codes and domain fields are safe for wire exposure, per ontology ADR-059.
- When ontology adds new `projection: public` codes, this profile's schema SHOULD be updated to include them.
- When ontology reclassifies a code from `public` to `internal`, this profile MUST remove it in the next major version.

---

## 10. References

- RFC 9457: Problem Details for HTTP APIs (IETF, July 2023)
- RFC 2119: Key words for use in RFCs (IETF)
- pact-public ADR-003: Extension Model and Reference Vertical Packs
- Ontology ADR-059: RFC 9457 Problem Detail Projection Policy
