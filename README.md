# PACT Public Specification Bundle

This repository publishes the public, implementation-neutral specification surface for PACT (Pack-based Agentic Contract for Trust).

PACT defines governance invariants and artifact contracts for deterministic, regulated agent execution. It does not prescribe any specific runtime architecture.

## Scope

This repository contains:

1. Informational and normative specification drafts.
2. OCI-1 profile and contract documentation.
3. Public JSON Schemas supporting compatibility and conformance claims.
4. Export manifest metadata (`manifest.sha256.json`, `export-metadata.json`).

This repository does not contain:

1. Runtime service implementation code.
2. Orchestration engines or workflow implementations.
3. Internal operational artifacts.
4. Private signing material or seed keys.
5. Private pack registries.

PACT is implementation-neutral. Multiple independent implementations are expected and encouraged.

## What Is a Pack and Why Not a Classical Ontology?

### The problem with classical ontologies at runtime

Classical ontologies (OWL, full RDF graphs, open-world inference) are designed for broad semantic modeling: global completeness, cross-domain reuse, and open-ended reasoning. These are valuable for knowledge representation and discovery. They are dangerous for agent execution in regulated domains, because:

1. **Open-world assumption**: a classical ontology assumes that anything not explicitly stated might still be true. An agent operating under open-world inference can reason itself into actions that were never authorized.
2. **Non-deterministic inference**: two reasoners processing the same OWL ontology can produce different entailments depending on implementation, rule ordering, and inference depth. Regulated execution requires deterministic replay.
3. **Unbounded scope**: a classical ontology grows to cover everything in the domain. An agent bound to an unbounded ontology has no clear authority boundary — it cannot distinguish "I am allowed to do this" from "this concept exists in my knowledge graph."
4. **No signing or validity window**: OWL files and RDF graphs have no standard mechanism for cryptographic signing, time-bound validity, or revocation. An agent cannot verify that the ontology it loaded is the one its operator approved.

PACT does not reject classical ontology. It treats classical ontologies as **upstream source material** that is compiled into bounded, signed, runtime-safe artifacts called packs.

### What a pack is

A pack is a self-contained, signed, time-bounded ontology slice scoped to a single domain. It contains everything an agent or service needs to operate within that domain — vocabulary, validation rules, intent mappings, and provenance — in a form that is deterministically verifiable.

### Anatomy of a pack

| Artifact | Format | Purpose | Classical ontology equivalent |
|----------|--------|---------|------------------------------|
| `pack.json` | JSON (pack descriptor) | Identity, domain, version, trust tier, validity window (`nbf`/`exp`), revocation epoch, file manifest, Dublin Core provenance | No equivalent — classical ontologies have no standard packaging, versioning, or validity metadata |
| `vocab.skos.jsonld` | SKOS (JSON-LD) | Domain vocabulary — concepts, labels, relationships, hierarchies | OWL classes and properties, but scoped to one domain slice rather than a universal graph |
| `shapes.ttl` | SHACL (Turtle) | Validation constraints — what data shapes are valid within this domain | OWL restrictions and axioms, but executable as validation rules rather than inference inputs |
| `context.jsonld` | JSON-LD context | Namespace bindings and term definitions for compact serialization | OWL imports and namespace declarations |
| `intent-mappings.json` | PACT schema | Deterministic mapping from SKOS concept URIs to intent classes with confidence floors | No equivalent — classical ontologies describe what things *are*, not what actions they *authorize* |
| `bundle.json` | JWS (signed) | Cryptographic manifest — content hashes of every artifact, signature, validity window, revocation epoch | No equivalent — classical ontologies are unsigned |
| `obt.jws` | JWS (signed) | Ontology binding token — signed attestation binding the pack to a specific policy snapshot | No equivalent |
| `overlay-*.json` | PACT schema | Jurisdictional overlays — region-specific or regulation-specific constraints that compose with deny-wins precedence | No equivalent — classical ontologies have no composition model with precedence rules |
| `lineage.json` | PACT schema | Derivation provenance — where this pack was compiled from, which upstream sources contributed | PROV-O provenance, but mandatory rather than optional |

### Why each element exists

**`pack.json` (descriptor)**: Classical ontologies have no standard way to say "this knowledge is valid from March 1 to March 31, was published by this authority, and should be revoked if epoch 3 is reached." The pack descriptor makes these operational concerns first-class. An agent can verify before loading: is this pack signed by an authority I trust? Is it within its validity window? Has it been revoked?

**`vocab.skos.jsonld` (vocabulary)**: SKOS is a W3C standard for controlled vocabularies. PACT uses SKOS rather than OWL because SKOS is descriptive (labels, hierarchies, mappings) without being inferential. An agent can look up what a concept means without triggering open-world reasoning. The vocabulary is scoped to one domain — a payments pack does not include telecommunications concepts.

**`shapes.ttl` (validation)**: SHACL is a W3C standard for validating RDF data against constraints. PACT uses SHACL rather than OWL restrictions because SHACL is closed-world by design: it validates what is present, not what might be inferred. A SHACL shape says "this field must be a string matching this pattern" — deterministic, testable, no inference required.

**`intent-mappings.json` (action authorization)**: This is where PACT diverges most from classical ontology. A classical ontology describes entities and relationships. An intent mapping describes what an agent is **authorized to do**: concept X maps to intent class Y with confidence floor Z. This is the bridge between knowledge (what things are) and governance (what actions are permitted).

**`bundle.json` (signed manifest)**: The bundle is what makes a pack trustworthy. Every artifact in the pack is content-hashed. The bundle is signed with Ed25519. An agent that verifies the bundle signature knows that no artifact has been tampered with since publication. Classical ontologies have no equivalent — you load an OWL file and hope it is the right one.

**Overlays (jurisdictional composition)**: A payments pack may need different constraints in the EU versus the UK. Classical ontologies handle this by either duplicating the entire ontology or using complex import chains. PACT uses overlays that compose deterministically with deny-wins precedence: if any overlay denies an action, the action is denied. This makes multi-jurisdiction governance predictable.

### The compilation pipeline

```
Classical ontology sources          PACT pack (runtime artifact)
┌──────────────────────┐           ┌─────────────────────────┐
│ OWL/RDF/SKOS broad   │           │ vocab.skos.jsonld       │
│ domain models         │──derive──►│ shapes.ttl              │
│                       │           │ intent-mappings.json    │
│ Regulatory texts      │──extract─►│ overlay-eu.json         │
│ (PSD3, MiFID, etc.)  │           │ overlay-uk.json         │
│                       │           │ context.jsonld          │
│ Industry standards    │──align───►│ lineage.json            │
│ (ISO 20022, etc.)    │           │ pack.json               │
│                       │           │ bundle.json (signed)    │
└──────────────────────┘           └─────────────────────────┘
     Open-world,                       Closed-world,
     unbounded,                        bounded,
     unsigned                          signed,
                                       time-valid,
                                       revocable
```

The pipeline is one-way at runtime. An agent never reasons against the upstream classical ontology directly. It operates within the compiled pack, which has been governance-gated, signed, and scoped. The classical ontology remains valuable for authoring, alignment, and discovery — but it stays out of the execution path.

For the full rationale, see `draft-lane2-closed-world-agentic-ontology-rationale-00.md`.

## Distribution Modes

PACT supports both deployer distribution modes:

1. Public pack registries (for open/shared ecosystems).
2. Private pack registries (for enterprise-controlled deployments).

Conformance requirements remain the same in both modes.

## Normative Contract Baseline

Implementations claiming OCI-1 compatibility MUST validate against the following normative artifacts:

1. `docs/architecture/oci-1-profile.json`
2. `docs/architecture/oci-1-contract-profile.md`
3. `schemas/pack-descriptor.schema.json`
4. `schemas/bundle-manifest.schema.json`
5. `schemas/pack-index.schema.json`
6. `schemas/intent-mappings.schema.json`
7. `schemas/entity-patterns.schema.json`
8. `schemas/convergence-fixtures.schema.json`
9. `schemas/promotion-gate-result.schema.json`
10. `schemas/delivery-profile.schema.json`
11. `schemas/pact-problem-extensions.schema.json`
12. `docs/rfc9457-pact-profile.md`

Conformance claims should reference specific artifact versions or release tags.

Authority boundary guidance:

1. `docs/architecture/pack-bounded-authority.md` — packs are authoritative for execution; external context (including RAG/graph retrieval) is advisory and must not silently expand scope.

Agentic error flow and ontology composition:

1. `docs/architecture/agentic-error-flow-and-domain-ontology.md` — how RFC 9457 problem detail responses flow through the agentic call chain when caller and target operate within ontology-governed domain spaces.

Security considerations:

1. `docs/architecture/security-unsigned-error-instruction-injection.md` — threat model for unsigned RFC 9457 error instruction injection, PACT's trust chain mitigations, and agent hygiene rules.

## Architecture Decisions

Public ADRs define specification intent and boundaries:

1. `docs/adr/ADR-000-public-scope-and-non-goals.md`
2. `docs/adr/ADR-001-governance-safety-invariants.md`
3. `docs/adr/ADR-002-artifact-contract-and-conformance-fixtures.md`
4. `docs/adr/ADR-003-extension-model-and-reference-vertical-packs.md`

ADR index:

1. `docs/adr/README.md`

## Conformance Fixtures

This repository includes implementation-neutral OCI-1 conformance fixtures under:

1. `fixtures/oci1/valid`
2. `fixtures/oci1/invalid`
3. `docs/architecture/oci-1-fixture-index.json`
4. `docs/architecture/oci-1-error-map.json`

Run the fixture harness:

```bash
node tools/run-oci1-conformance-fixtures.mjs
```

Run the reference telco CIC+PSC fixture harness:

```bash
node tools/run-telco-reference-fixtures.mjs
```

Run the reference policy CIC+PSC fixture harness:

```bash
node tools/run-policy-reference-fixtures.mjs
```

Regenerate synthetic fixtures (including test signatures):

```bash
node tools/generate-oci1-fixtures.mjs
```

RFC 9457 problem detail conformance fixtures:

1. `fixtures/rfc9457/` — valid and fail fixtures for PACT problem extension schema

Fixture signing keys are test-only and must not be used in production systems.

## Reference Vertical Packs

This repository includes:

1. `verticals/telco-reference-pack/`
2. `verticals/policy-reference-pack/`
3. `verticals/iso20022-reference-pack/`
4. `verticals/travel-air-shopping-demo-pack/`
5. `verticals/travel-hotel-booking-demo-pack/`
6. `verticals/travel-air-order-lifecycle-demo-pack/`
7. `verticals/travel-itinerary-fusion-demo-pack/`

This telco pack is a non-normative example vertical profile demonstrating PACT extension mechanics.
It does not define TM Forum standards and does not replace IG1453.

The policy reference pack is a non-normative base-policy example demonstrating cross-domain policy semantics independent of telco standards.
It includes a minimal jurisdiction overlay deny-wins composition example.

The ISO 20022 reference pack is a review-candidate payments ontology artifact bundle for external interoperability and governance review.

The travel demo packs are grounded example ontology bundles for air shopping, hotel booking, air order lifecycle, and itinerary fusion.

## Real-World Deployment View

For a concise implementation-neutral flow from task intake to regulated execution evidence, see:

1. `docs/architecture/real-world-deployment-overview.md`

## Implementation Status

PACT is not a theoretical specification. It is derived from a working agentic governance system with production-grade tooling.

The internal reference implementation includes:

**Runtime services:**

1. **Policy gate server** — HTTP service handling pack verification, policy snapshot binding, STA (Secure Token Attestation) issuance, overlay composition, and taxonomy enforcement. Content-addressed state with optimistic locking, append-only audit logs, and in-process cache event broker.
2. **Attribute credential provider** — JWKS endpoint, credential minting, enrollment management, and rate-limited token issuance for pilot onboarding.
3. **Pack registry** — immutable file server for signed pack artifacts, manifests, and bundle metadata.

**Authoring and extraction toolchain:**

4. **Pack authoring pipeline** — SKOS vocabulary compilation, SHACL shape generation, intent mapping extraction, Ed25519 signing, and bundle manifest production.
5. **NER extraction tooling** — zero-shot Named Entity Recognition (GLiNER) for accelerated vocabulary and concept authoring from source documents (regulatory texts, standards, specifications). Containerized, deterministic (pinned model versions, SHA256 provenance), with domain-specific extraction profiles (telco, regulatory). All extractions produce candidates only — human review is mandatory before any candidate enters the ontology pipeline. Pluggable adapter architecture (GLiNER default, extensible to spaCy/OpenNLP/GATE).
6. **Database schema extraction** — introspection and canonicalization from Salesforce, OpenAPI, and generic database sources into normalized concept schemas.
7. **Intent canonicalization** — deterministic normalization of inbound intents against compiled pack taxonomy.
8. **Schema normalization** — cross-format schema alignment tooling.

**Governance and quality:**

9. **Promotion gates** — automated conformance validation, stability analysis (Lyapunov spectral framework), drift detection, and candidate-status enforcement (unreviewed NER candidates are rejected) before packs are promoted to production.
10. **Drift detection** — continuous monitoring for semantic drift between pack versions, scorer stability degradation, and policy threshold sensitivity changes. Production posture checks and promotion-gate mode parity validation.
11. **Quality scorecards** — automated pack quality assessment against configurable thresholds.

**Integration and deployment:**

12. **A2A bridge** — normalization of Agent2Agent protocol task types into PACT canonical decisions with policy-gate attestation before execution.
13. **Evidence pipeline** — Dublin Core metadata generation, Merkle-chain linking, and immutable audit trail production.
14. **Client SDKs** — TypeScript and Go clients for policy snapshot retrieval, bundle binding, attestation, Ed25519 signature verification, and JWS/JWK validation.
15. **Container infrastructure** — multi-stage Docker builds, Docker Compose orchestration, Alpine runtime images with health checks, and static binary compilation.

**Operational tooling:**

16. **50+ pipeline scripts** — domain-specific orchestration for telco, financial services, medical, regulatory, and standards-body workflows. Includes backup/restore, bundle export, production rehearsal, and shadow stability gates.

**What this repository publishes**: the specification surface — schemas, contract profiles, conformance fixtures, reference packs, and architectural documentation. Everything an implementor needs to build a conformant system.

**What this repository does not publish**: the runtime services, toolchain, SDKs, extraction tools, database schemas, pipeline scripts, signing keys, or operational infrastructure. These are implementation choices that belong to each adopter.

Implementors should expect to build:

1. A pack verification and policy evaluation service (signature checking, hash validation, validity window enforcement, revocation checking, intent admissibility, fact validation, state transition checking, overlay composition).
2. A signing and publishing pipeline for their own domain packs.
3. An extraction and curation pipeline for sourcing vocabulary and concepts from domain documents (regulatory texts, standards, databases) — with mandatory human review gates before candidates enter production packs.
4. Client libraries for policy binding, attestation, and signature verification in their language of choice.
5. An evidence emission layer appropriate to their audit requirements.
6. Promotion gates and drift detection appropriate to their deployment cadence.
7. Integration adapters for their agent framework (A2A, MCP, or custom protocols).

The conformance fixtures in this repository (`fixtures/oci1/`, `fixtures/rfc9457/`) provide the test baseline. An implementation that passes these fixtures and validates against the published schemas is conformant regardless of language, runtime, or infrastructure choices.

## Publication Model

This repository is generated from the core engineering repository using an allowlisted export process.

The export boundary ensures:

1. Separation of specification artifacts from runtime implementation.
2. No publication of signing keys, runtime code, or operational registries.
3. Reproducible public specification surfaces.

PACT does not depend on any specific implementation.

## License

This repository is licensed under the Apache License, Version 2.0.

The Apache 2.0 license applies to the specification documents and schema artifacts contained herein. It does not imply publication or licensing of any private implementation.

See [LICENSE](./LICENSE).
