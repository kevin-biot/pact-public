#!/usr/bin/env node
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');
const fixtureIndexPath = process.argv[2] || path.join(root, 'fixtures', 'dssc-bilateral-challenge-receipt', 'index.json');

function loadJson(p) { return JSON.parse(fs.readFileSync(p, 'utf8')); }
function bundleIdFor(bundlePath) {
  const content = fs.readFileSync(bundlePath, 'utf8');
  const digest = createHash('sha256').update(content, 'utf8').digest('hex');
  return 'sha256:' + digest;
}
function reqStr(name, value) {
  return typeof value === 'string' && value.trim() !== '';
}

function evaluateCase(casePath, expectedBundleId, decisionSpace) {
  const payload = loadJson(casePath);
  const d = payload.decision || {};

  if (payload.bundleId !== expectedBundleId) {
    return { status: 'fail', code: 'PSC_BUNDLE_COMMIT_MISMATCH', details: 'expected ' + expectedBundleId + ', got ' + (payload.bundleId || '<missing>') };
  }
  if (d.type !== 'DSSCBilateralGovernanceIntent') {
    return { status: 'fail', code: 'CIC_CANONICAL_VALUE_INVALID', details: 'type must be DSSCBilateralGovernanceIntent' };
  }
  if (typeof d.intent_class !== 'string' || !decisionSpace.intent_resource_map[d.intent_class]) {
    return { status: 'fail', code: 'ESCALATE_OUT_OF_SCOPE_INTENT', details: 'intent is outside bilateral bounded domain' };
  }

  const required = decisionSpace.required_fields_by_intent[d.intent_class] || [];
  for (const field of required) {
    if (!reqStr(field, d[field])) {
      if (field === 'policy_snapshot_target') {
        return { status: 'fail', code: 'DENY_POLICY_SNAPSHOT_MISSING', details: 'target policy snapshot is required' };
      }
      return { status: 'fail', code: 'CIC_REQUIRED_FIELD_MISSING', details: field + ' is required' };
    }
  }

  if (d.acceptance_hash !== d.payload_hash) {
    return { status: 'fail', code: 'DENY_RECEIPT_HASH_MISMATCH', details: 'acceptance hash must bind challenge payload hash' };
  }

  if (reqStr('correlation_id', d.correlation_id) && reqStr('receipt_correlation_id', d.receipt_correlation_id) && d.correlation_id !== d.receipt_correlation_id) {
    return { status: 'fail', code: 'DENY_CORRELATION_MISMATCH', details: 'correlation ids differ between challenge and receipt' };
  }

  return { status: 'pass', code: 'ALLOW_IN_SCOPE', details: 'bilateral challenge/receipt checks passed' };
}

function main() {
  const fixtureIndex = loadJson(fixtureIndexPath);
  const packPath = path.join(root, fixtureIndex.pack_path || 'verticals/dssc-bilateral-challenge-receipt-demo-pack');
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
