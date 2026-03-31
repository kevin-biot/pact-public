# FHIR Encounter Transitions Demo Pack

Non-normative public demo pack for patient transition workflows using FHIR Encounter resources.

## Stepwise Transition Surface

1. Ward transfer using `Encounter.location` updates.
2. Ward step-down using `Encounter.location` and class transitions.
3. Discharge using `Encounter.status` with discharge disposition context.
4. Longitudinal transition tracking via `EncounterHistory`.
5. Transition notifications via subscription/messaging patterns.

## Source Grounding

1. https://www.hl7.org/fhir/encounter.html
2. https://www.hl7.org/fhir/encounterhistory.html
3. https://www.hl7.org/fhir/patient-administration-module.html

## Status

1. Public candidate demo pack for interoperability and governance review.
2. Non-normative and does not replace implementation guides or local ADT profiles.
