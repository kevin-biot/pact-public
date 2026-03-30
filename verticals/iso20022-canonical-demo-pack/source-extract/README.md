# ISO 20022 Source Extract (Current Usable Snapshot)

This directory is a runtime-adjacent copy of the current canonical extraction
artifacts for ISO 20022.

## Included files

1. `erepo-summary.json`
2. `message-identifiers.json`
3. `candidate-concepts.json`
4. `pacs.008.001.13.extract-profile.json`
5. `CANONICAL-EXTRACTION-CONTRACT-pacs.008.001.13.md`

## Provenance

1. Extract snapshot copied from: `candidates/iso20022/erepo-registered-latest`
2. Narrow profile copied from: `candidates/iso20022/pacs.008.001.13.extract-profile.json`
3. Contract copied from: `candidates/iso20022/CANONICAL-EXTRACTION-CONTRACT-pacs.008.001.13.md`

## Intended use

1. Reviewer-visible source evidence for canonical extraction inputs.
2. Seed inputs for pack authoring updates in `registry/iso20022`.
3. Deterministic reference for narrow `pacs.008.001.13` slicing decisions.
