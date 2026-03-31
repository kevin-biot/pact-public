#!/usr/bin/env node
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');
const fixtureIndexPath = process.argv[2] || path.join(root, 'fixtures', 'telco-fault-diagnosis', 'index.json');

function loadJson(p) { return JSON.parse(fs.readFileSync(p, 'utf8')); }
function bundleIdFor(bundlePath) {
  const content = fs.readFileSync(bundlePath, 'utf8');
  const digest = createHash('sha256').update(content, 'utf8').digest('hex');
  return `sha256:${digest}`;
}
function isRfc3339(value) {
  if (typeof value !== 'string') return false;
  const date = new Date(value);
  return !Number.isNaN(date.getTime()) && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(value);
}

function evaluateCase(casePath, expectedBundleId) {
  const payload = loadJson(casePath);
  const d = payload.decision || {};

  if (payload.bundleId !== expectedBundleId) {
    return { status: 'fail', code: 'PSC_BUNDLE_COMMIT_MISMATCH', details: `expected ${expectedBundleId}, got ${payload.bundleId || '<missing>'}` };
  }
  if (d.type !== 'FaultDiagnosis') {
    return { status: 'fail', code: 'CIC_CANONICAL_VALUE_INVALID', details: 'type must be FaultDiagnosis' };
  }
  if (d.intent_class !== 'fault.diagnosis.request.v1') {
    return { status: 'fail', code: 'ESCALATE_OUT_OF_SCOPE_TASK', details: 'intent is outside fault diagnosis bounded domain' };
  }

  const id = d.targetObject?.identifier;
  if (typeof id !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9._:-]{7,63}$/.test(id)) {
    return { status: 'fail', code: 'DENY_INVALID_FAULT_DIAGNOSIS_FIELDS', details: 'targetObject.identifier failed policy constraints' };
  }
  if (!isRfc3339(d.taskContext?.faultOccurrenceTime)) {
    return { status: 'fail', code: 'DENY_INVALID_FAULT_DIAGNOSIS_FIELDS', details: 'taskContext.faultOccurrenceTime must be RFC3339 UTC' };
  }
  if (!['Low', 'Medium', 'High'].includes(d.constraints?.taskPriority)) {
    return { status: 'fail', code: 'DENY_INVALID_FAULT_DIAGNOSIS_FIELDS', details: 'constraints.taskPriority must be Low|Medium|High' };
  }

  return { status: 'pass', code: 'PASS', details: 'CIC and PSC checks passed for telco fault diagnosis demo pack' };
}

function main() {
  const fixtureIndex = loadJson(fixtureIndexPath);
  const packPath = path.join(root, fixtureIndex.pack_path || 'verticals/telco-fault-diagnosis-demo-pack');
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
