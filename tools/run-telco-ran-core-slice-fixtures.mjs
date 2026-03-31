#!/usr/bin/env node
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');
const fixtureIndexPath = process.argv[2] || path.join(root, 'fixtures', 'telco-ran-core-slice', 'index.json');

function loadJson(p) { return JSON.parse(fs.readFileSync(p, 'utf8')); }
function bundleIdFor(bundlePath) {
  const content = fs.readFileSync(bundlePath, 'utf8');
  const digest = createHash('sha256').update(content, 'utf8').digest('hex');
  return `sha256:${digest}`;
}

function evaluateCase(casePath, expectedBundleId) {
  const payload = loadJson(casePath);
  const d = payload.decision || {};

  if (payload.bundleId !== expectedBundleId) {
    return { status: 'fail', code: 'PSC_BUNDLE_COMMIT_MISMATCH', details: `expected ${expectedBundleId}, got ${payload.bundleId || '<missing>'}` };
  }
  if (d.type !== 'RanCoreSliceIntent') {
    return { status: 'fail', code: 'CIC_CANONICAL_VALUE_INVALID', details: 'type must be RanCoreSliceIntent' };
  }

  const allowedIntents = new Set(['telco.ran.slice.attach.v1']);
  if (!allowedIntents.has(d.intent_class)) {
    return { status: 'fail', code: 'ESCALATE_OUT_OF_SCOPE_INTENT', details: 'intent is outside ran/core/slice bounded domain' };
  }

  if (typeof d.sliceId !== 'string' || !/^[a-z0-9][a-z0-9-]{2,63}$/.test(d.sliceId)) {
    return { status: 'fail', code: 'DENY_INVALID_RAN_SLICE_FIELDS', details: 'sliceId failed policy constraints' };
  }

  const allowedTargets = new Set(['gnbdufunction','gnbcucpfunction','nrcelldu','nrcellcu','amffunction','smffunction','upffunction','nwdafunction']);
  if (typeof d.target !== 'string' || !allowedTargets.has(d.target)) {
    return { status: 'fail', code: 'DENY_INVALID_RAN_SLICE_FIELDS', details: 'target must be an allowed managed function' };
  }

  return { status: 'pass', code: 'PASS', details: 'CIC and PSC checks passed for telco ran core slice demo pack' };
}

function main() {
  const fixtureIndex = loadJson(fixtureIndexPath);
  const packPath = path.join(root, fixtureIndex.pack_path || 'verticals/telco-ran-core-slice-demo-pack');
  const bundlePath = path.join(packPath, 'bundle.json');
  const expectedBundleId = bundleIdFor(bundlePath);

  const cases = Array.isArray(fixtureIndex.cases) ? fixtureIndex.cases : [];
  let failed = 0;
  const results = [];

  for (const c of cases) {
    const actual = evaluateCase(path.join(root, c.path), expectedBundleId);
    const expected = c.expected || { status: 'pass', code: 'PASS' };
    const match = actual.status === expected.status && actual.code === expected.code;
    if (!match) failed += 1;
    results.push({ id: c.id, expected, actual, match });
  }

  console.log(JSON.stringify({ fixture_index: path.relative(root, fixtureIndexPath), bundle_id: expectedBundleId, cases_total: results.length, cases_failed: failed, results }, null, 2));
  process.exit(failed === 0 ? 0 : 1);
}

main();
