#!/usr/bin/env node
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');
const fixtureIndexPath = process.argv[2] || path.join(root, 'fixtures', 'dssc-rulebook-policy-mapping', 'index.json');

function loadJson(p) { return JSON.parse(fs.readFileSync(p, 'utf8')); }
function bundleIdFor(bundlePath) {
  const content = fs.readFileSync(bundlePath, 'utf8');
  const digest = createHash('sha256').update(content, 'utf8').digest('hex');
  return 'sha256:' + digest;
}
function hasValue(value) {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim() !== '';
  return true;
}

function evaluateCase(casePath, expectedBundleId, decisionSpace) {
  const payload = loadJson(casePath);
  const d = payload.decision || {};

  if (payload.bundleId !== expectedBundleId) {
    return { status: 'fail', code: 'PSC_BUNDLE_COMMIT_MISMATCH', details: 'expected ' + expectedBundleId + ', got ' + (payload.bundleId || '<missing>') };
  }
  if (d.type !== 'DSSCPolicyIntent') {
    return { status: 'fail', code: 'CIC_CANONICAL_VALUE_INVALID', details: 'type must be DSSCPolicyIntent' };
  }
  if (typeof d.intent_class !== 'string' || !decisionSpace.intent_resource_map[d.intent_class]) {
    return { status: 'fail', code: 'ESCALATE_OUT_OF_SCOPE_INTENT', details: 'intent is outside policy bounded domain' };
  }

  if (!hasValue(d.policy_snapshot_id)) {
    return { status: 'fail', code: 'DENY_POLICY_SNAPSHOT_UNBOUND', details: 'policy_snapshot_id is required and must be bound' };
  }

  const required = decisionSpace.required_fields_by_intent[d.intent_class] || [];
  for (const field of required) {
    if (!hasValue(d[field])) {
      return { status: 'fail', code: 'CIC_REQUIRED_FIELD_MISSING', details: field + ' is required' };
    }
  }

  if (d.constraint_mapped === false || (typeof d.constraint_expression === 'string' && d.constraint_expression.toUpperCase().includes('UNMAPPED'))) {
    return { status: 'fail', code: 'DENY_CONSTRAINT_UNMAPPED', details: 'constraint is unmapped in crosswalk profile' };
  }

  if (d.odrl_obligation && d.odrl_obligation_status !== 'satisfied') {
    return { status: 'fail', code: 'DENY_OBLIGATION_UNSATISFIED', details: 'obligation unresolved at evaluation time' };
  }

  if (d.odrl_permission === true && d.odrl_prohibition === true) {
    return { status: 'pass', code: 'DENY_POLICY_CONFLICT_DENY_WINS', details: 'conflict resolved with deny-wins semantics' };
  }

  if (d.odrl_prohibition === true) {
    return { status: 'pass', code: 'DENY_RULEBOOK_PROHIBITION', details: 'rulebook prohibition applied' };
  }

  return { status: 'pass', code: 'ALLOW_IN_SCOPE', details: 'policy allowed after deterministic checks' };
}

function main() {
  const fixtureIndex = loadJson(fixtureIndexPath);
  const packPath = path.join(root, fixtureIndex.pack_path || 'verticals/dssc-rulebook-policy-mapping-demo-pack');
  const expectedBundleId = bundleIdFor(path.join(packPath, 'bundle.json'));
  const decisionSpace = loadJson(path.join(packPath, 'decision-space.json'));

  const cases = Array.isArray(fixtureIndex.cases) ? fixtureIndex.cases : [];
  if (cases.length === 0) { console.error('no fixture cases found'); process.exit(2); }

  let failed = 0;
  const results = [];
  for (const c of cases) {
    const actual = evaluateCase(path.join(root, c.path), expectedBundleId, decisionSpace);
    const expected = c.expected || { status: 'pass', code: 'ALLOW_IN_SCOPE' };
    const match = actual.status === expected.status && actual.code === expected.code;
    if (!match) failed += 1;
    results.push({ id: c.id, expected, actual, match });
  }

  console.log(JSON.stringify({ fixture_index: path.relative(root, fixtureIndexPath), bundle_id: expectedBundleId, cases_total: results.length, cases_failed: failed, results }, null, 2));
  process.exit(failed === 0 ? 0 : 1);
}

main();
