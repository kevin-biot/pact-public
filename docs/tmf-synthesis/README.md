# TMF Synthesis Evidence Bundle

This directory publishes the authoring-time evidence used to generate TM Forum demo surface packs.

## Included artifacts

1. `tmf-synthesis-profile.json`  
   Profile contract describing synthesis inputs, selection policy, and candidate pack views.
2. `tmf-synthesis-seed.json`  
   Generated synthesis output (API surfaces, SID metadata coverage, field enrichment, candidate pack views).
3. `tmf-api-catalog.json`  
   TMF OpenAPI catalog with operation/path statistics and provisional ontology/SID associations.
4. `tmf-api-to-ontology-crosswalk.json`  
   API-level crosswalk entries derived from the catalog.
5. `tmf638-service-field-crosswalk.json`  
   Field-level crosswalk example for TMF638 Service resource.

## Purpose

1. Provide transparent provenance for TMF demo packs in `verticals/tmf-*-pack`.
2. Show extraction and synthesis shape without exposing private runtime/tooling internals.
3. Enable independent review of bounded-surface design decisions.
