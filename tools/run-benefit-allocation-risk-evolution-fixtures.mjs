#!/usr/bin/env node
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');
const fixtureIndexPath = process.argv[2] || path.join(root, 'fixtures', 'benefit-allocation-risk-evolution', 'index.json');

function loadJson(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function bundleIdFor(bundlePath) {
  const content = fs.readFileSync(bundlePath, 'utf8');
  const digest = createHash('sha256').update(content, 'utf8').digest('hex');
  return `sha256:${digest}`;
}

function parseIso(s) {
  const t = Date.parse(s);
  return Number.isNaN(t) ? null : t;
}

function isSha256(s) {
  return typeof s === 'string' && /^sha256:[a-f0-9]{64}$/.test(s);
}

function activeVersionAt(ts, versions) {
  for (const v of versions) {
    const from = parseIso(v.active_from);
    const until = v.active_until ? parseIso(v.active_until) : null;
    if (from === null) continue;
    if (ts < from) continue;
    if (until !== null && ts > until) continue;
    return v;
  }
  return null;
}

function evaluateCase(casePath, expectedBundleId, conceptVersions) {
  const payload = loadJson(casePath);
  const d = payload.decision || {};
  const effectiveBundleId = payload.bundleId === '__AUTO_BUNDLE_ID__' ? expectedBundleId : payload.bundleId;

  if (effectiveBundleId !== expectedBundleId) {
    return {
      status: 'fail',
      code: 'PSC_BUNDLE_COMMIT_MISMATCH',
      details: `expected ${expectedBundleId}, got ${effectiveBundleId || '<missing>'}`
    };
  }

  if (d.type !== 'BenefitAllocationEvolutionIntent') {
    return { status: 'fail', code: 'CIC_CANONICAL_VALUE_INVALID', details: 'type must be BenefitAllocationEvolutionIntent' };
  }

  if (d.intent_class !== 'policy.benefit.high_risk_applicant.evaluate.v1') {
    return { status: 'fail', code: 'ESCALATE_OUT_OF_SCOPE_INTENT', details: 'intent is outside benefit allocation risk evolution bounded domain' };
  }

  if (d.governance_gate_passed !== true) {
    return { status: 'fail', code: 'DENY_GOVERNANCE_GATE_NOT_SATISFIED', details: 'governance gate must pass' };
  }

  if (d.control_validation_proof !== true) {
    return { status: 'fail', code: 'DENY_CONTROL_VALIDATION_MISSING', details: 'control validation proof is required' };
  }

  const reqTs = parseIso(d.request_time);
  if (reqTs === null) {
    return { status: 'fail', code: 'CIC_REQUIRED_FIELD_MISSING', details: 'request_time is required and must be ISO date-time' };
  }

  const active = activeVersionAt(reqTs, conceptVersions?.versions || []);
  if (!active || d.concept_version !== active.version) {
    return {
      status: 'fail',
      code: 'DENY_VERSION_NOT_ACTIVE',
      details: `decision must bind to active concept version ${active?.version || '<none>'}`
    };
  }

  if (!Array.isArray(active.allowed_actions) || !active.allowed_actions.includes(d.requested_action)) {
    return { status: 'fail', code: 'DENY_ACTION_NOT_ALLOWED_FOR_VERSION', details: 'requested_action is not allowed for active version' };
  }

  if (typeof d.risk_score !== 'number' || d.risk_score < 0 || d.risk_score > 1) {
    return { status: 'fail', code: 'CIC_CANONICAL_VALUE_INVALID', details: 'risk_score must be a number in [0,1]' };
  }

  const threshold = active.risk_threshold;
  if (d.requested_action === 'allocate_benefit' && !(d.risk_score < threshold)) {
    return {
      status: 'fail',
      code: 'DENY_DECISION_NOT_JUSTIFIED_BY_ACTIVE_THRESHOLD',
      details: 'allocate_benefit requires risk_score below active threshold'
    };
  }

  if (d.requested_action === 'deny_benefit' && !(d.risk_score >= threshold)) {
    return {
      status: 'fail',
      code: 'DENY_DECISION_NOT_JUSTIFIED_BY_ACTIVE_THRESHOLD',
      details: 'deny_benefit requires risk_score at or above active threshold'
    };
  }

  const ev = d.evidence || {};
  if (!isSha256(ev.prev_hash) || !isSha256(ev.event_hash)) {
    return { status: 'fail', code: 'CIC_CANONICAL_VALUE_INVALID', details: 'evidence hashes must be sha256 digests' };
  }

  return {
    status: 'pass',
    code: 'ALLOW_DECISION_BOUND_TO_ACTIVE_VERSION',
    details: `decision is bound to active version ${active.version}`
  };
}

function main() {
  const fixtureIndex = loadJson(fixtureIndexPath);
  const packPath = path.join(root, fixtureIndex.pack_path || 'verticals/benefit-allocation-risk-evolution-demo-pack');
  const expectedBundleId = bundleIdFor(path.join(packPath, 'bundle.json'));
  const conceptVersions = loadJson(path.join(packPath, 'concept-versions.json'));

  const cases = Array.isArray(fixtureIndex.cases) ? fixtureIndex.cases : [];
  if (cases.length === 0) {
    console.error('no fixture cases found');
    process.exit(2);
  }

  let failed = 0;
  const results = [];
  for (const c of cases) {
    const actual = evaluateCase(path.join(root, c.path), expectedBundleId, conceptVersions);
    const expected = c.expected || { status: 'pass', code: 'ALLOW_DECISION_BOUND_TO_ACTIVE_VERSION' };
    const match = actual.status === expected.status && actual.code === expected.code;
    if (!match) failed += 1;
    results.push({ id: c.id, expected, actual, match });
  }

  console.log(JSON.stringify({
    fixture_index: path.relative(root, fixtureIndexPath),
    bundle_id: expectedBundleId,
    cases_total: results.length,
    cases_failed: failed,
    results
  }, null, 2));

  process.exit(failed === 0 ? 0 : 1);
}

main();
