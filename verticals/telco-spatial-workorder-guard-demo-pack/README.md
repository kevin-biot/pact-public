# Telco Spatial Work-Order Guard Demo Pack

Non-normative public demo pack for dual-boundary RAN/Core execution governance.

## Why This Pack Exists

This pack demonstrates **dual-boundary authorization** for agent actions:

1. Capability boundary: the action and parameters must be explicitly allowed.
2. Spatial boundary: the target asset must be within the authorized work-order polygon.

A request is allowed only when both boundaries pass and the work-order time window is active.

## Minimum Scenario

1. A base station fault is detected.
2. A work order opens with an authorized polygon and time window.
3. The agent receives a request to retune or restart a target radio.
4. The runtime checks work-order validity, action/parameter constraints, spatial containment/intersection, and active window.
5. Inside polygon and in-policy requests are allowed; outside or out-of-policy requests are denied.
6. Every decision is recorded with reason code and evidence hash linkage.

## Decision Rule

Allow only if all are true:

1. Work order exists and is valid.
2. Requested action is in `authorized_actions`.
3. Request parameters satisfy action constraints.
4. Request time is inside `[valid_from, valid_until]`.
5. Target asset point is `inside` or `boundary` on the authorized polygon.

## Evidence Surface

Decision events include:

1. `decision`
2. `reason_code`
3. `matched_rule_id`
4. `spatial_result` (`inside|boundary|outside`)
5. `capability_result`
6. `prev_hash`
7. `event_hash`

## Status

1. Public candidate demo pack for interoperability and governance review.
2. Non-normative and not a 3GPP or TM Forum conformance profile.
