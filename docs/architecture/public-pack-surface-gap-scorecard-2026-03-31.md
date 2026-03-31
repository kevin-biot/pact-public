# Public Pack Surface Gap Scorecard (2026-03-31)

## Objective

Increase public pack credibility and breadth using candidate demo packs with executable fixture evidence.

## Telco Snapshot

| Dimension | telco-reference-pack | telco-reference-pack/extended-retail | telco-retail-demo-pack | telco-fault-diagnosis-demo-pack | telco-ran-core-slice-demo-pack |
|---|---:|---:|---:|---:|---:|
| Intent classes | 1 | 6 | 6 | 1 | 1 |
| Patterns artifact | No | Yes | Yes | Yes | Yes |
| Thesaurus artifacts | No | Yes | Yes | Yes | Yes |
| Overlay artifacts | No | Yes (EU, OM) | Yes (EU, OM) | No | No |
| Decision space | No | Yes | Yes | Yes | Yes |
| Fixture runner | Yes (`run-telco-reference-fixtures`) | No | Yes (`run-telco-retail-fixtures`) | Yes (`run-telco-fault-diagnosis-fixtures`) | Yes (`run-telco-ran-core-slice-fixtures`) |
| Baseline OCI signed set | Yes | Companion only | Yes | Yes | Yes |

## Travel Snapshot

| Dimension | travel-air-shopping | travel-hotel-booking | travel-air-order-lifecycle | travel-itinerary-fusion |
|---|---:|---:|---:|---:|
| Full-shape companion files | Yes | Yes | Yes | Yes |
| Fixture triplet (happy/adversarial/out-of-scope) | Yes | Yes | Yes | Yes |
| Public example status | Published | Published | Published | Published |

## Recommended Next Promotions

1. Add CI job to run all vertical fixture harnesses (`telco-reference`, `telco-retail`, `telco-fault-diagnosis`, `telco-ran-core-slice`, `policy-reference`).
2. Add reviewer guides for each telco candidate pack with promotion criteria and traceability references.
3. Add cross-pack deterministic replay report for the five telco harnesses.
