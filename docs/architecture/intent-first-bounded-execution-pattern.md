# Intent-First Bounded Execution Pattern

Status: active  
Last updated: 2026-03-31

## 1. Core Position

The customer expresses intent.  
The system does not delegate to an autonomous agent proxy.  
The runtime resolves intent against a pre-bound domain ontology pack that defines the only admissible functions and outcomes.

## 2. Anti-Pattern: Agent-Card/API-First

Traditional framing often assumes:

1. agent = actor,
2. customer delegates task,
3. receiving agent explores capabilities and decides dynamically.

This creates avoidable failure modes:

1. capability hallucination,
2. overreach into unintended tools,
3. non-deterministic tool chaining,
4. weak auditability ("why did it do that?").

## 3. Pattern: Intent First, API Behind Intent

This architecture uses:

1. agent = bounded execution surface,
2. customer input = intent ingress,
3. runtime resolution constrained to known:
   1. functions,
   2. states,
   3. transitions.

APIs are a local implementation concern behind intent routing, not the primary interoperability surface.

## 4. Operational Rule

Never start with tool inventory discussion.  
Start with intent classification, then bind to the bounded function space.

In short:

1. intent -> ontology-bound intent class,
2. intent class -> admissible transitions,
3. transition -> allowed local API/function call.

## 5. Plumber Example (Canonical)

Customer says:

`I've got a leak`

System does not:

1. open-endedly negotiate plumber tool capabilities,
2. run free-form multi-agent capability discovery.

System does:

1. load plumbing ontology pack,
2. map `leak` to in-scope intent cluster,
3. expose admissible actions only:
   1. diagnose,
   2. isolate,
   3. repair,
   4. escalate.

The runtime interpreter executes within that bounded toolbox.

## 6. Payments Example

Customer says:

`Send EUR 50`

System does:

1. bind payment ontology pack,
2. map to payment intent class,
3. execute admissible functions only:
   1. initiate transfer,
   2. validate counterparty,
   3. select rail,
   4. confirm settlement.

No proxy autonomy is required to invent behavior.

## 7. TM Forum API Example: Valid JSON Is Not Enough

A traditional API gateway can confirm payload syntax, but that alone does not prove the request is admissible for the stated intent.

Closed-world ontology execution validates a bounded tuple:

1. noun (resource class),
2. verb (operation class),
3. parameter profile (allowed fields, ranges, and transitions).

Illustrative (non-normative) flow:

1. Incoming intent: `change active service configuration`
2. Ontology mapping: `tmf:ServiceOrder` + `create` + `modify-only-params`
3. Local API capability (behind intent): `POST /tmf-api/serviceOrdering/v4/serviceOrder`

Illustrative payload:

```json
{
  "orderItem": [
    {
      "action": "delete",
      "service": {
        "id": "svc-123"
      }
    }
  ]
}
```

This payload may be JSON-valid for the endpoint, but it is ontology-invalid for a `modify-only-params` profile.
Result: fail closed (deny or escalate), not execute.

That is the boundary value: API capability exists, but ontology-constrained intent determines admissibility.

## 8. Why This Matters in Regulated Domains

This removes a large class of runtime failures:

1. invented capabilities,
2. wrong tool invocation,
3. unintended action chains,
4. unclear liability boundaries.

It improves:

1. safety,
2. determinism,
3. interoperability,
4. auditability.

## 9. Security Effect: Prompt Injection Resistance by Boundary

Closed-world ontology binding creates a practical prompt-injection safety boundary.

1. Prompt text can propose actions, but cannot expand admissible functions.
2. Anything outside the pack-defined function/state/transition set is out-of-scope.
3. Out-of-scope instructions are rejected or escalated (fail-closed), never silently executed.

This provides a strong default defense: many prompt-injection attempts become non-executable because capability invention is structurally blocked.

## 10. Relationship to A2A Agent Cards

A2A-style agent cards can be useful metadata, but they are not the execution contract.

Execution contract must remain:

1. intent-first,
2. ontology-bound,
3. fail-closed outside admissible scope.

## 11. Normative Statement

For governed execution paths, systems SHOULD implement:

1. intent-first ingress,
2. pre-bound ontology pack resolution,
3. deterministic mapping to admissible transitions,
4. explicit deny/escalate for out-of-scope intents.

Systems SHOULD NOT rely on runtime dynamic capability discovery as the primary control surface for regulated actions.
Systems SHOULD treat prompt-supplied capability requests outside ontology scope as invalid input and fail closed.

## 12. ISO 20022 + Swift Extension Boundary (Public Architecture Linkage)

In payments, this pattern applies directly to Swift/ISO 20022 coexistence:

1. Swift message handling is treated as a wrapper/interoperability surface.
2. ISO 20022 concepts/messages provide the semantic anchor.
3. Ontology intent/fact constraints remain the execution authority.

Consequence:

1. Do not mutate core ISO 20022 message semantics to carry full ontology payloads.
2. Carry bounded linkage pointers in allowed extension channels (for example `SupplementaryData`) when profile permits.
3. Carry full ontology/evidence context in signed sidecar artifacts linked by message identifiers.

Why this helps consumers:

1. consistent semantic interpretation across MT/MX/profile variants,
2. stronger replay/audit through canonical reason lineage,
3. explicit fail-closed behavior when mapping or evidence linkage is invalid.

No free lunch:

1. integration complexity rises (message + sidecar resolution/verification),
2. operational dependencies increase (evidence availability/cache),
3. latency and troubleshooting overhead increase without disciplined implementation.

See:

1. `https://github.com/kevin-biot/ontology/blob/main/docs/ADR/ADR-062-swift-messaging-extension-profile-and-coexistence-boundary.md`
2. `https://github.com/kevin-biot/ontology/blob/main/docs/ADR/ADR-063-iso20022-ontology-extension-carriage-and-consumer-integration-surface.md`
3. `https://github.com/kevin-biot/ontology/blob/main/docs/architecture/swift-iso20022-wrapper-and-coupling-candidates-2026-03-31.md`
4. `https://github.com/kevin-biot/ontology/blob/main/docs/architecture/iso20022-ontology-consumer-integration-surface-2026-03-31.md`
