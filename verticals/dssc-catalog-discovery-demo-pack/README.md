# dssc-catalog-discovery-demo-pack

This is a DSSC-aligned demo ontology pack for `dssc-catalog-discovery` under Stage-4 pack authoring.

## Purpose

Demonstrate DSSC-aligned publication/discovery semantics mapped into a bounded PACT pack profile.

## Source Grounding

Canonical source references used for this pack draft are listed in `source-extract/sources.json`.

Primary references:
- https://blueprint.dssc.eu/
- https://toolbox.dssc.eu/?pane=technical&technical=data-services-and-offerings-descriptions
- https://www.w3.org/TR/vocab-dcat-3/
- https://interoperable-europe.ec.europa.eu/collection/semic-support-centre/solution/dcat-application-profile-data-portals-europe
- https://eclipse-dataspace-protocol-base.github.io/DataspaceProtocol/HEAD/

## Intent Surface

- `dssc.catalog.publish_offering.v1`: Publish new offering metadata into catalog scope.
- `dssc.catalog.update_offering.v1`: Update existing offering metadata and lifecycle state.
- `dssc.catalog.remove_offering.v1`: Remove/deprecate offering from discoverable catalog set.
- `dssc.catalog.query_offering.v1`: Query offering metadata in bounded discovery profile.

## Determinism Boundary

- Out-of-scope behavior is `escalate`.
- Policy/bundle binding is required for admitted execution paths.
- Deny reason codes are explicit and stable for fixture replay.

## Included Artifacts

- `README.md`
- `pack.json`
- `context.jsonld`
- `vocab.skos.jsonld`
- `shapes.ttl`
- `thesaurus.jsonld`
- `thesaurus-local.json`
- `patterns.json`
- `intent-mappings.json`
- `convergence.json`
- `decision-space.json`
- `message-identifiers.json`
- `extraction-summary.json`
- `bundle.json`
- `obt.jws`
- `source-extract/sources.json`
- `source-extract/crosswalk/dssc-dcat-to-pact-crosswalk.v1.json`

## Notes

- This pack is a non-normative demo surface for conformance and governance experimentation.
- Fixture harness wiring is planned in Stage-5.
