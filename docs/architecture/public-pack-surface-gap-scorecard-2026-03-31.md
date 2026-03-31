# Public Pack Surface Gap Scorecard (2026-03-31)

## Objective

Increase public pack credibility and breadth using candidate demo packs with executable fixture evidence.

## Telco Snapshot

| Dimension | telco-reference-pack | telco-reference-pack/extended-retail | telco-retail-demo-pack |
|---|---:|---:|---:|
| Intent classes | 1 | 6 | 6 |
| Patterns artifact | No | Yes | Yes |
| Thesaurus artifacts | No | Yes | Yes |
| Overlay artifacts | No | Yes (EU, OM) | Yes (EU, OM) |
| Decision space | No | Yes | Yes |
| Fixture runner | Yes (`run-telco-reference-fixtures`) | No | Yes (`run-telco-retail-fixtures`) |
| Baseline OCI signed set | Yes | Companion only | Yes |

## Travel Snapshot

| Dimension | travel-air-shopping | travel-hotel-booking | travel-air-order-lifecycle | travel-itinerary-fusion |
|---|---:|---:|---:|---:|
| Full-shape companion files | Yes | Yes | Yes | Yes |
| Fixture triplet (happy/adversarial/out-of-scope) | Yes | Yes | Yes | Yes |
| Public example status | Published | Published | Published | Published |

## Recommended Next Promotions

1. Publish `telco-fault-diagnosis-demo-pack` as a separate signed public vertical.
2. Publish `telco-ran-core-slice-demo-pack` with deterministic fixture harness.
3. Add CI job to run all vertical fixture harnesses (`telco-reference`, `telco-retail`, `policy-reference`).
